import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../database/prisma.service";
import { AiScript, Prisma } from "@prisma/client";
import { FileExtractionService } from "../videos/file-extraction.service";
import { SynthesiaService } from "../videos/synthesia.service";
import { GroqService } from "./groq.service";
import * as Prompts from "./prompts";

@Injectable()
export class AiScriptsService {
  private readonly logger = new Logger(AiScriptsService.name);

  constructor(
    private prisma: PrismaService,
    private fileExtractionService: FileExtractionService,
    private synthesiaService: SynthesiaService,
    private groqService: GroqService,
  ) {}

  async create(data: Prisma.AiScriptCreateInput): Promise<AiScript> {
    return this.prisma.aiScript.create({
      data,
    });
  }

  async findAll(): Promise<AiScript[]> {
    return this.prisma.aiScript.findMany({
      where: { isDeleted: false },
      orderBy: { createdAt: "desc" },
      include: {
        videos: {
          where: { isDeleted: false },
        },
      },
    });
  }

  async findOne(id: string): Promise<AiScript | null> {
    return this.prisma.aiScript.findFirst({
      where: { id, isDeleted: false },
      include: {
        videos: {
          where: { isDeleted: false },
        },
      },
    });
  }

  async update(
    id: string,
    data: Prisma.AiScriptUpdateInput,
  ): Promise<AiScript> {
    return this.prisma.aiScript.update({
      where: { id },
      data,
    });
  }

  async remove(id: string): Promise<AiScript> {
    return this.prisma.aiScript.update({
      where: { id },
      data: { isDeleted: true },
    });
  }

  async generateFromFiles(files: Array<Express.Multer.File>, metadata: any) {
    const {
      title,
      courseName,
      teacherName,
      teacherRole,
      teacherSpecialty,
      studentProfile,
      videoType,
      tone,
      style,
      templateId,
    } = metadata;

    // 1. Extract content from files
    let sourceContent = "";
    for (const file of files) {
      try {
        let text = "";
        if (file.mimetype === "application/pdf") {
          text = await this.fileExtractionService.extractTextFromPdf(
            file.buffer,
          );
        } else if (
          file.mimetype ===
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        ) {
          text = await this.fileExtractionService.extractTextFromDocx(
            file.buffer,
          );
        }
        if (text) {
          sourceContent += `\n--- File: ${file.originalname} ---\n${text}\n`;
        }
      } catch (e) {
        this.logger.error(
          `Failed to extract text from ${file.originalname}`,
          e,
        );
      }
    }

    // 2. Fetch Template Details to get raw variables
    let rawTemplateVariables = {};
    let templateName = null;
    try {
      if (templateId) {
        const template = await this.synthesiaService.getTemplate(templateId);
        if (template && template.variables) {
          rawTemplateVariables = template.variables;
        }
        if (template && template.title) {
          templateName = template.title;
        }
      }
    } catch (e) {
      this.logger.error(
        `Failed to fetch template details for ${templateId}`,
        e,
      );
    }

    // 3. Call AI to generate script and fill template variables
    let templateData = {};

    // Normalize title to ensure it's a string, handling potential array input
    let finalTitle = title || courseName || "Untitled Script";
    if (Array.isArray(finalTitle)) {
      finalTitle = finalTitle[0];
    }

    try {
      if (sourceContent && Object.keys(rawTemplateVariables).length > 0) {
        this.logger.log(
          `Starting AI generation with Groq/Llama for script: ${finalTitle}`,
        );

        // Calculate scene count based on template variables (script_voice_text_n)
        let sceneCount = 0;
        const variablesArray = Array.isArray(rawTemplateVariables)
          ? rawTemplateVariables
          : Object.values(rawTemplateVariables);

        if (variablesArray.length > 0) {
          const indices = variablesArray
            .map((v: any) => {
              // Assuming v has 'id' or 'label' property like "script_voice_text_scene_1"
              const label = v.label || v.id || "";
              const match = label.match(/script_voice_text_scene_(\d+)/);
              return match ? parseInt(match[1], 10) : 0;
            })
            .filter((n: number) => n > 0);

          if (indices.length > 0) {
            sceneCount = Math.max(...indices);
          }
        }

        if (sceneCount === 0) sceneCount = 12; // Default fallback
        this.logger.log(
          `Detected ${sceneCount} scenes from template variables.`,
        );

        // Prepare prompts
        const truncatedSource =
          sourceContent.length > 25000
            ? sourceContent.substring(0, 25000) + "...(truncated)"
            : sourceContent;

        // Convert rawTemplateVariables to the JSON structure expected by the prompt
        // The prompt expects a JSON where keys are the labels/ids to be filled
        const templateStructureForPrompt = JSON.stringify(
          rawTemplateVariables,
          null,
          2,
        );

        const systemPrompt = Prompts.mapTechnicalSheetToTemplateSystemPrompt(
          courseName || "[Course Name]",
          teacherName || "[Teacher Name]",
          teacherRole || "[Role]",
          teacherSpecialty || "",
          studentProfile || "Students",
          tone || "Formal",
          style || "Direct",
          sceneCount,
        );

        const userPrompt = Prompts.mapTechnicalSheetToTemplateUserPrompt(
          templateStructureForPrompt,
          truncatedSource,
        );

        const completion = await this.groqService.checkCompletion({
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          model: "llama-3.3-70b-versatile",
          jsonMode: true,
        });

        const responseContent = completion.choices[0].message.content;
        if (responseContent) {
          templateData = JSON.parse(responseContent);
          this.logger.log("AI Generation successful.");
        } else {
          this.logger.warn("AI Generation returned empty content.");
        }

        // --- BACKFILL LOGIC: Ensure all template variables are present ---
        if (variablesArray.length > 0) {
          variablesArray.forEach((variable: any) => {
            const key = variable.label || variable.id; // Synthesia uses label as key for generating video
            if (key && !templateData.hasOwnProperty(key)) {
              // Use default value if available, otherwise empty string
              // Note: Synthesia API might fail if required fields are missing, but empty string is safer than undefined
              templateData[key] =
                variable.value !== undefined && variable.value !== null
                  ? variable.value
                  : " ";
              this.logger.debug(`Backfilled missing key: ${key}`);
            }
          });
        }
        // -----------------------------------------------------------------
      }
    } catch (error) {
      this.logger.error("Failed to generate AI script", error);
      // We continue creation even if AI fails, saving empty templateData
    }

    return this.prisma.aiScript.create({
      data: {
        title: finalTitle,
        courseName: courseName || "",
        teacherName: teacherName || "",
        teacherRole: teacherRole || "",
        teacherSpecialty: teacherSpecialty || "",
        studentProfile: studentProfile || "",
        videoType: videoType || "Course Welcome",
        tone: tone || "",
        style: style || "",
        templateId: templateId || "",
        templateName: templateName || null,
        templateData: templateData,
        sourceContent: sourceContent,
        rawTemplateVariables: rawTemplateVariables,
      },
    });
  }

  async regenerateScene(
    id: string,
    sceneNumber: number,
    currentScript: any,
    userInstruction: string,
  ) {
    // 1. Fetch original script to get metadata and context
    const script = await this.prisma.aiScript.findUnique({
      where: { id },
    });

    if (!script) {
      throw new Error("Script not found");
    }

    // 2. Identify variables for the requested scene
    // We assume currentScript.templateData holds the current state of variables
    const currentData = currentScript.templateData || {};
    const sceneVariables: Record<string, any> = {};

    // Filter variables for the specific scene
    Object.keys(currentData).forEach((key) => {
      if (
        key.includes(`_scene_${sceneNumber}`) ||
        key.endsWith(`_${sceneNumber}`)
      ) {
        sceneVariables[key] = currentData[key];
      }
    });

    // 3. Get context from previous and next scenes
    // Simple heuristic: look for voice text of adjacent scenes
    const prevVoiceKey = `script_voice_text_scene_${sceneNumber - 1}`;
    const nextVoiceKey = `script_voice_text_scene_${sceneNumber + 1}`;

    // Also try legacy naming
    const prevVoiceKeyLegacy = `script_voice_text_${sceneNumber - 1}`;
    const nextVoiceKeyLegacy = `script_voice_text_${sceneNumber + 1}`;

    const prevSceneContext =
      currentData[prevVoiceKey] || currentData[prevVoiceKeyLegacy] || "";
    const nextSceneContext =
      currentData[nextVoiceKey] || currentData[nextVoiceKeyLegacy] || "";

    // 4. Generate Prompts
    const systemPrompt = Prompts.regenerateSceneSystemPrompt(
      script.courseName || "",
      script.teacherName || "",
      script.teacherRole || "",
      script.studentProfile || "",
      script.tone || "",
      script.style || "",
    );

    const userPrompt = Prompts.regenerateSceneUserPrompt(
      sceneNumber,
      sceneVariables,
      prevSceneContext,
      nextSceneContext,
      userInstruction,
    );

    this.logger.log(`Regenerating Scene ${sceneNumber} for script ${id}`);

    // 5. Call AI
    const completion = await this.groqService.checkCompletion({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      model: "llama-3.3-70b-versatile",
      jsonMode: true,
    });

    const responseContent = completion.choices[0].message.content;
    let newSceneData = {};

    if (responseContent) {
      try {
        newSceneData = JSON.parse(responseContent);
      } catch (e) {
        this.logger.error(
          "Failed to parse AI response for scene regeneration",
          e,
        );
        throw new Error("AI response was not valid JSON");
      }
    }

    return newSceneData;
  }
}
