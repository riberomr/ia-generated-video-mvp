import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from "aws-lambda";
import { LambdaClient, InvokeCommand, InvocationType } from "@aws-sdk/client-lambda";
import * as bedrock from "../lib/bedrock";
import * as synthesia from "../lib/synthesia";
import * as fileExtraction from "../lib/file-extraction";
import * as Prompts from "../lib/prompts";
import { ok, created, accepted, notFound, badRequest, serverError } from "../lib/response";
import Busboy from "busboy";
import { getRepository } from "../repositories";
import { AiScript } from "../repositories/IAiScriptRepository";

// Initialize Lambda Client
const lambda = new LambdaClient({ region: process.env.AWS_REGION });
const WORKER_FUNCTION_NAME = process.env.WORKER_FUNCTION_NAME;
const BEDROCK_MODEL = process.env.BEDROCK_MODEL_ID || "us.anthropic.claude-3-5-sonnet-20241022-v2:0";

// Helper to get repo on demand (ensures env vars are read per request if needed)
const repo = () => getRepository();

// ── Types ───────────────────────────────────────────────────────────────────

interface WorkerPayload {
  type: 'GENERATE_SCRIPT' | 'REGENERATE_SCENE';
  scriptId: string;
  payload: any;
}

// ── Router ──────────────────────────────────────────────────────────────────
export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  console.log("HANDLER INVOKED");
  console.log("AWS_SAM_LOCAL:", process.env.AWS_SAM_LOCAL);

  const method = event.httpMethod;
  const path = event.path;
  const id = event.pathParameters?.id;

  console.log(`[HANDLER] Method: ${method}, Path: ${path}, ID: ${id}`);
  
  try {

    if (method === "POST" && path.endsWith("/generate-from-files")) {
      return handleGenerateFromFiles(event);
    }
    if (method === "POST" && id && path.endsWith("/regenerate-scene")) {
      return handleRegenerateScene(id, event);
    }
    if (method === "POST" && !id) {
      return handleCreate(event);
    }
    if (method === "GET" && !id) {
      return handleFindAll();
    }
    if (method === "GET" && id) {
      return handleFindOne(id);
    }
    if (method === "DELETE" && id) {
      return handleRemove(id);
    }
    if (method === "PATCH" && id) {
      return handleUpdate(id, event);
    }

    return badRequest("Route not matched");
  } catch (error: any) {
    console.error("ai-scripts handler error:", error);
    return serverError(error.message || "Internal server error");
  }
}

// ── Worker Handler ──────────────────────────────────────────────────────────
export async function worker(event: WorkerPayload, context: Context): Promise<void> {
  console.log("Worker started:", JSON.stringify(event));
  const { type, scriptId, payload } = event;

  try {
    if (type === 'GENERATE_SCRIPT') {
      await processGenerateScript(scriptId, payload);
    } else if (type === 'REGENERATE_SCENE') {
      await processRegenerateScene(scriptId, payload);
    }
  } catch (error: any) {
    console.error("Worker failed:", error);
    await repo().updateStatus(scriptId, "FAILED");
  }
}

async function processGenerateScript(scriptId: string, payload: any) {
  const {
    sourceContent,
    rawTemplateVariables,
    courseName,
    teacherName,
    teacherRole,
    teacherSpecialty,
    studentProfile,
    tone,
    style,
    scenePurposes
  } = payload;

  await repo().updateStatus(scriptId, "PROCESSING");

  // Calculate scene count
  let sceneCount = 0;
  const variablesArray: any[] = Array.isArray(rawTemplateVariables)
    ? rawTemplateVariables
    : Object.values(rawTemplateVariables);

  if (variablesArray.length > 0) {
    const indices = variablesArray
      .map((v: any) => {
        const label = v.label || v.id || "";
        const match = label.match(/(?:script_voice_text_scene_|text_scene_|INFO_.*_scene_|scene_)(\d+)/);
        return match ? parseInt(match[1], 10) : 0;
      })
      .filter((n: number) => n > 0);
    if (indices.length > 0) sceneCount = Math.max(...indices);
  }
  if (sceneCount === 0) sceneCount = 12;

  // Prepare prompts
  const variablesForPrompt = variablesArray.filter(
    (v: any) =>
      !(v.label && v.label.startsWith("INFO_")) &&
      !(v.id && v.id.startsWith("INFO_")),
  );

  const templateStructureForPrompt = JSON.stringify(variablesForPrompt, null, 2);

  const systemPrompt = Prompts.mapTechnicalSheetToTemplateSystemPromptWithGoals(
    courseName || "[Course Name]",
    teacherName || "[Teacher Name]",
    teacherRole || "[Role]",
    teacherSpecialty || "",
    studentProfile || "Students",
    tone || "Formal",
    style || "Direct",
    sceneCount,
    scenePurposes,
  );

  const userPrompt = Prompts.mapTechnicalSheetToTemplateUserPrompt(
    templateStructureForPrompt,
    sourceContent,
  );

  let templateDataValues: Record<string, string> = {};

  const completion = await bedrock.checkCompletion({
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    model: BEDROCK_MODEL,
    jsonMode: true,
  });

  const responseContent = completion.choices[0].message.content;
  if (responseContent) {
    templateDataValues = JSON.parse(responseContent);
  }

  // Handle INFO_ variables and backfill
  variablesArray.forEach((v: any) => {
    const key = v.label || v.id || "";
    if (key.startsWith("INFO_")) {
      templateDataValues[key] = " ";
      const match = key.match(/_scene_(\d+)/);
      if (match) {
        const sceneNum = match[1];
        const purposeMatch = key.match(/INFO_(.+)_scene_\d+/);
        if (purposeMatch && !scenePurposes[sceneNum]) {
          scenePurposes[sceneNum] = purposeMatch[1].replace(/_/g, " ");
        }
      }
    }
  });

  // Backfill missing variables
  variablesArray.forEach((variable: any) => {
    const key = variable.label || variable.id;
    if (key && !templateDataValues.hasOwnProperty(key)) {
      templateDataValues[key] =
        variable.value !== undefined && variable.value !== null
          ? variable.value
          : " ";
    }
  });

  const finalTemplateData = {
    data: templateDataValues,
    scenePurposes,
  };

  await repo().update(scriptId, {
      templateData: finalTemplateData,
      status: "COMPLETED"
  });
}

async function processRegenerateScene(scriptId: string, payload: any) {
  const { sceneNumber, currentScript, userInstruction } = payload;
  
  await repo().updateStatus(scriptId, "PROCESSING");

  // Prepare prompts reusing existing logic
  const rawTemplateData = currentScript?.templateData || {};
  let currentData = rawTemplateData;
  if (rawTemplateData.data) {
    currentData = rawTemplateData.data;
  }

  const sceneVariables: Record<string, any> = {};
  Object.keys(currentData).forEach((key) => {
    if (key.startsWith("INFO_")) return;
    if (key.includes(`_scene_${sceneNumber}`) || key.endsWith(`_${sceneNumber}`)) {
      sceneVariables[key] = currentData[key];
    }
  });

  const prevVoiceKey = `script_voice_text_scene_${sceneNumber - 1}`;
  const nextVoiceKey = `script_voice_text_scene_${sceneNumber + 1}`;
  const prevVoiceKeyLegacy = `script_voice_text_${sceneNumber - 1}`;
  const nextVoiceKeyLegacy = `script_voice_text_${sceneNumber + 1}`;
  const prevSceneContext = currentData[prevVoiceKey] || currentData[prevVoiceKeyLegacy] || "";
  const nextSceneContext = currentData[nextVoiceKey] || currentData[nextVoiceKeyLegacy] || "";

  const systemPrompt = Prompts.regenerateSceneSystemPrompt(
    currentScript.courseName || "",
    currentScript.teacherName || "",
    currentScript.teacherRole || "",
    currentScript.studentProfile || "",
    currentScript.tone || "",
    currentScript.style || "",
  );

  const userPrompt = Prompts.regenerateSceneUserPrompt(
    sceneNumber,
    sceneVariables,
    prevSceneContext,
    nextSceneContext,
    userInstruction,
  );

  const completion = await bedrock.checkCompletion({
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    model: BEDROCK_MODEL,
    jsonMode: true,
  });

  const responseContent = completion.choices[0].message.content;
  
  if (responseContent) {
    const newSceneData = JSON.parse(responseContent);
    
    // Merge new scene data into existing templateData
    const updatedData = { ...currentData, ...newSceneData };
    const updatedTemplateData = {
        ...rawTemplateData,
        data: updatedData
    };

    await repo().update(scriptId, {
        templateData: updatedTemplateData,
        status: "COMPLETED"
    });
  } else {
    throw new Error("AI response was empty");
  }
}

// ── API Handlers ────────────────────────────────────────────────────────────

async function handleCreate(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  const body = JSON.parse(event.body || "{}");
  const script = await repo().create({ 
      ...body,
      status: "PENDING"
  });
  return created(script);
}

async function handleFindAll(): Promise<APIGatewayProxyResult> {
  const scripts = await repo().findAll();
  return ok(scripts);
}

async function handleFindOne(id: string): Promise<APIGatewayProxyResult> {
  // Logic to include videos is currently specific to Prisma/Postgres capability
  // For now, the repository interface returns the script. 
  // If videos are needed, we might need to extend the repository or do a separate fetch if using Dynamo.
  // The current Prisma implementation includes videos. The Dynamo implementation should also include videos (via query).
  const script = await repo().findById(id);
  if (!script) return notFound("Script not found");
  return ok(script);
}

async function handleUpdate(id: string, event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  const body = JSON.parse(event.body || "{}");
  const script = await repo().update(id, body);
  return ok(script);
}

async function handleRemove(id: string): Promise<APIGatewayProxyResult> {
  const script = await repo().update(id, { isDeleted: true });
  return ok(script);
}

async function handleGenerateFromFiles(
  event: APIGatewayProxyEvent,
): Promise<APIGatewayProxyResult> {
  const body = await parseMultipart(event);

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
    files: rawFiles,
  } = body;

  let scenePurposes: Record<string, string> = {};
  try {
    if (body.scenePurposes) {
      scenePurposes =
        typeof body.scenePurposes === "string"
          ? JSON.parse(body.scenePurposes)
          : body.scenePurposes;
    }
  } catch {
    console.warn("Failed to parse scenePurposes");
  }

  // 1. Sync Text Extraction
  let sourceContent = "";
  const files: Array<{ name: string; mimetype: string; base64: string }> = rawFiles || [];

  for (const file of files) {
    try {
      const buffer = Buffer.from(file.base64, "base64");
      let text = "";
      if (file.mimetype === "application/pdf") {
        text = await fileExtraction.extractTextFromPdf(buffer);
      } else if (
        file.mimetype ===
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      ) {
        text = await fileExtraction.extractTextFromDocx(buffer);
      }
      if (text) {
        sourceContent += `\n--- File: ${file.name} ---\n${text}\n`;
      }
    } catch (e: any) {
      console.error(`Failed to extract text from ${file.name}`, e);
    }
  }

  // 2. Fetch Template Variables (Sync to fail fast if broken)
  let rawTemplateVariables: any = {};
  let templateName: string | null = null;
  try {
    if (templateId) {
      const template = await synthesia.getTemplate(templateId);
      if (template?.variables) rawTemplateVariables = template.variables;
      if (template?.title) templateName = template.title;
    }
  } catch (e) {
    console.error(`Failed to fetch template details for ${templateId}`, e);
  }

  let finalTitle = title || courseName || "Untitled Script";
  if (Array.isArray(finalTitle)) finalTitle = finalTitle[0];

  // 3. Create Record (PENDING)
  const script = await repo().create({
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
    templateName,
    templateData: {}, // Empty initially
    sourceContent,
    rawTemplateVariables,
    status: "PENDING"
  });

  // 4. Invoke Worker
  const payload: WorkerPayload = {
      type: 'GENERATE_SCRIPT',
      scriptId: script.id,
      payload: {
          sourceContent, // Note: This might be large. If too large for Lambda payload (256KB for async), we should store in S3. For MVP assuming it fits.
          rawTemplateVariables,
          courseName,
          teacherName,
          teacherRole,
          teacherSpecialty,
          studentProfile,
          tone,
          style,
          scenePurposes
      }
  };

  await invokeWorker(payload);

  return accepted(script);
}

async function handleRegenerateScene(
  id: string,
  event: APIGatewayProxyEvent,
): Promise<APIGatewayProxyResult> {
  const body = JSON.parse(event.body || "{}");
  const { sceneNumber, currentScript, userInstruction } = body;

  const script = await repo().findById(id);
  if (!script) return notFound("Script not found");

  // Validate we can proceed
  await repo().updateStatus(id, "PROCESSING");

  const payload: WorkerPayload = {
      type: 'REGENERATE_SCENE',
      scriptId: id,
      payload: {
          sceneNumber,
          currentScript: script, // Pass the script from DB or from body? Body 'currentScript' might have unsaved changes from UI. Use body.
          userInstruction
      }
  };

  await invokeWorker(payload);

  return accepted({ status: "PROCESSING", message: "Scene regeneration started" });
}

async function invokeWorker(payload: WorkerPayload) {
    if (process.env.AWS_SAM_LOCAL === 'true') {
        console.log("⚠️ Running in SAM Local: Invoking worker directly (Sync)");
        // In local, we await to ensure it runs before the process freezes.
        // This makes the local API behavior Synchronous, but allows testing the Worker logic.
        await worker(payload, {} as Context);
        return;
    }

    if (!WORKER_FUNCTION_NAME) {
        console.error("WORKER_FUNCTION_NAME not defined");
        return;
    }
    try {
        const command = new InvokeCommand({
            FunctionName: WORKER_FUNCTION_NAME,
            InvocationType: InvocationType.Event, // Async
            Payload: JSON.stringify(payload)
        });
        await lambda.send(command);
    } catch (e) {
        console.error("Failed to invoke worker", e);
        // Fallback: DB fail?
        await repo().updateStatus(payload.scriptId, "FAILED");
    }
}




// ── Helpers ─────────────────────────────────────────────────────────────────

interface ParsedBody {
  [key: string]: any;
  files: Array<{ name: string; mimetype: string; base64: string }>;
}

const parseMultipart = (event: APIGatewayProxyEvent): Promise<ParsedBody> => {
  return new Promise((resolve, reject) => {
    const contentType =
      event.headers["content-type"] || event.headers["Content-Type"];

    if (!contentType || !contentType.includes("multipart/form-data")) {
      try {
        const body = JSON.parse(event.body || "{}");
        resolve({ ...body, files: body.files || [] });
        return;
      } catch (e) {
        reject(new Error("Invalid Content-Type or Body"));
        return;
      }
    }

    const busboy = Busboy({
      headers: { "content-type": contentType },
    });

    const result: ParsedBody = { files: [] };

    busboy.on("file", (fieldname, file, info) => {
      const { filename, mimeType } = info;
      const chunks: Buffer[] = [];

      file.on("data", (data) => chunks.push(data));
      file.on("end", () => {
        result.files.push({
          name: filename,
          mimetype: mimeType,
          base64: Buffer.concat(chunks).toString("base64"),
        });
      });
    });

    busboy.on("field", (fieldname, val) => {
      if (result[fieldname]) {
        if (Array.isArray(result[fieldname])) {
          result[fieldname].push(val);
        } else {
          result[fieldname] = [result[fieldname], val];
        }
      } else {
        result[fieldname] = val;
      }
    });

    busboy.on("error", (error) => reject(error));
    busboy.on("finish", () => resolve(result));

    const bodyToCheck = event.body || "";
    const isBase64 = event.isBase64Encoded;
    if (isBase64) {
      busboy.write(Buffer.from(bodyToCheck, "base64"));
    } else {
      busboy.write(bodyToCheck, "utf-8");
    }
    busboy.end();
  });
};
