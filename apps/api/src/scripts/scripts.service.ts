import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { GroqService } from '../courses/groq.service';
import { SynthesiaService } from '../videos/synthesia.service';
import { AnalyzeScriptDto, SmartScriptResponse, CreateScriptDto } from '@eduvideogen/shared-types';

@Injectable()
export class ScriptsService {
    private readonly logger = new Logger(ScriptsService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly groqService: GroqService,
        private readonly synthesiaService: SynthesiaService
    ) { }

    async analyzeAndMapScript(dto: AnalyzeScriptDto): Promise<SmartScriptResponse> {
        // 1. Get Template Details
        const template = await this.synthesiaService.getTemplateDetails(dto.templateId);

        // 2. Extract Scene Count from description (simple regex or parsing)
        // Description usually has "X scenes total".
        // Fallback to 3 if undefined.
        let sceneCount = 3;
        if (template.description) {
            const match = template.description.match(/(\d+)\s+scenes?\s+total/i);
            if (match) {
                sceneCount = parseInt(match[1], 10);
            }

            if (template.variables.filter(v => v.id.includes('script_voice_text_')).length > 0) {
                sceneCount = template.variables.filter(v => v.id.includes('script_voice_text_')).length;
            }
        }

        // 3. Prepare Template JSON for LLM (only variables needed mostly)
        const templateJson = JSON.stringify({
            variables: template.variables || {}
        }, null, 2);

        // 4. Call Groq
        this.logger.log(`Calling Groq to map source text to ${sceneCount} scenes.`);
        const result = await this.groqService.analyzeAndMapScript(
            dto.topic,
            dto.sourceText,
            templateJson,
            sceneCount
        );

        // 5. Return result directly 
        return result;
    }
    async createScript(dto: CreateScriptDto) {
        // Create Data Object
        const data: any = {
            course: { connect: { id: dto.courseId } },
            scenes: dto.scenes,
            originalScenes: dto.scenes, // Initially original is same as current
            status: 'DRAFT',
            isTemplated: dto.isTemplated || false,
        };

        if (dto.templateId) data.templateId = dto.templateId;
        if (dto.templateData) data.templateData = dto.templateData;

        // If isTemplated, we don't need separate voiceScript column anymore.
        // The data is inside templateData as scene_voice_text_{n}.
        // We still need 'scenes' to satisfy the schema if it's required ? 
        // Schema says: scenes Json. 
        // We can just save an empty array or the scene list if passed.

        if (dto.isTemplated) {
            // For templated scripts, we might pass the array of strings as 'scenes' in DTO, 
            // but we rely on templateData.
            // Ensure 'scenes' is valid JSON.
            if (!data.scenes) data.scenes = [];
        }

        return this.prisma.script.create({ data });
    }
}
