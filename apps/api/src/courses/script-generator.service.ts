import { Injectable, Logger } from '@nestjs/common';
import { Scene } from '@eduvideogen/shared-types';
import { GroqService } from './groq.service';
import * as Prompts from './prompts';

@Injectable()
export class ScriptGeneratorService {
    private readonly logger = new Logger(ScriptGeneratorService.name);

    constructor(private readonly groqService: GroqService) { }

    async generateScript(content: string): Promise<Scene[]> {
        const systemPrompt = Prompts.generateScriptPrompt;

        const completion = await this.groqService.checkCompletion({
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: content },
            ],
            model: 'llama-3.3-70b-versatile',
            jsonMode: true,
        });

        const responseContent = completion.choices[0].message.content;
        if (!responseContent) {
            throw new Error('Failed to generate script from Groq');
        }

        try {
            const parsed = JSON.parse(responseContent);
            return Array.isArray(parsed) ? parsed : parsed.scenes || [];
        } catch (error) {
            this.logger.error("Groq response parsing error", error);
            throw new Error('Invalid JSON response from Groq');
        }
    }

    async analyzeAndMapScript(topic: string, sourceText: string, templateJson: string, sceneCount: number): Promise<any> {
        const calendarSceneIndex = sceneCount > 1 ? sceneCount - 1 : 1;
        const systemPrompt = Prompts.analyzeAndMapScriptSystemPrompt(sceneCount, calendarSceneIndex);
        const userPrompt = Prompts.analyzeAndMapScriptUserPrompt(topic, sourceText, templateJson);

        const completion = await this.groqService.checkCompletion({
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt },
            ],
            model: 'llama-3.3-70b-versatile',
            jsonMode: true,
        });

        const responseContent = completion.choices[0].message.content;
        if (!responseContent) {
            throw new Error('Failed to analyze and map script from Groq');
        }

        try {
            return JSON.parse(responseContent);
        } catch (error) {
            this.logger.error("Groq response parsing error", error);
            throw new Error('Invalid JSON response from Groq for Smart Script');
        }
    }

    async generateScriptFromScratch(title: string, sourceText: string, sceneCount: number, scenes: {
        topic: string,
        duration?: number,
        emotion?: string,
        visual_context?: string,
        objective?: string,
        complexity?: string,
        pov?: string,
        keywords?: string[]
    }[]): Promise<any> {
        const systemPrompt = Prompts.generateScriptFromScratchSystemPrompt(sceneCount);

        const scenesDescription = scenes.map((s, i) => `
      Genera el texto para la **Escena ${i + 1}**.
      - **Topic:** "${s.topic}"
      - **Objetivo:** "${s.objective || 'educational'}" (Guiate por esto: Hook -> Atrapante; CTA -> Acción clara).
      - **Complejidad:** "${s.complexity || 'general'}"
      - **POV:** "${s.pov || 'second_person'}"
      - **Emoción:** "${s.emotion || 'neutral'}" (Recuerda: refléjalo en la puntuación y tono).
      - **Duración:** ${s.duration || 10} segundos.
      - **Contexto Visual:** "${s.visual_context || 'N/A'}"
      - **Keywords obligatorias:** ${s.keywords && s.keywords.length > 0 ? s.keywords.join(', ') : 'Ninguna'}
      
      *Instrucción:* Escribe el guion respetando estrictamente el tono, estilo y las keywords solicitadas.
      `).join('\n\n----------------\n\n');

        const userPrompt = Prompts.generateScriptFromScratchUserPrompt(title, sourceText, sceneCount, scenesDescription);

        const completion = await this.groqService.checkCompletion({
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt },
            ],
            model: 'llama-3.3-70b-versatile',
            jsonMode: true,
        });

        const responseContent = completion.choices[0].message.content;
        if (!responseContent) {
            throw new Error('Failed to generate script from Groq');
        }

        try {
            return JSON.parse(responseContent);
        } catch (error) {
            this.logger.error("Groq response parsing error", error);
            throw new Error('Invalid JSON response from Groq');
        }
    }

    async regenerateScene(
        sourceContentText: string,
        allScenes: any[],
        targetSceneIndex: number,
        currentSceneData: any,
        userFeedback?: string
    ): Promise<any> {
        const wordsPerSecond = 2.5;
        const targetWordCount = Math.floor(currentSceneData.duration * wordsPerSecond);
        const maxWordLimit = targetWordCount + 10;

        const systemPrompt = Prompts.regenerateSceneSystemPrompt(targetSceneIndex, maxWordLimit);

        const scenesSummary = allScenes.map((s, i) => `Scene ${i + 1}: ${s.topic} - ${s.scriptText?.substring(0, 50)}...`).join('\n');

        const userPrompt = Prompts.regenerateSceneUserPrompt(
            sourceContentText,
            scenesSummary,
            targetSceneIndex,
            currentSceneData,
            targetWordCount,
            maxWordLimit,
            userFeedback
        );

        const completion = await this.groqService.checkCompletion({
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt },
            ],
            model: 'llama-3.3-70b-versatile',
            jsonMode: true,
        });

        const responseContent = completion.choices[0].message.content;
        if (!responseContent) {
            throw new Error('Failed to regenerate scene from Groq');
        }

        try {
            return JSON.parse(responseContent);
        } catch (error) {
            this.logger.error("Groq response parsing error", error);
            throw new Error('Invalid JSON response from Groq');
        }
    }

    async generateScriptWithTechnicalSheet(sourceText: string, metadata: any = {}): Promise<any> {
        const {
            teacherName = "[Teacher Name]",
            teacherRole = "[Role]",
            teacherSpecialty = "",
            instructionalDesigner = "",
            tone = "Formal/Close",
            style = "Engage, Connect, Activate",
            studentProfile = "Postgraduate students",
            courseName = "[Course Name]"
        } = metadata;

        const systemPrompt = Prompts.generateScriptWithTechnicalSheetSystemPrompt(
            courseName, teacherName, teacherRole, teacherSpecialty, studentProfile, tone, style
        );

        const userPrompt = Prompts.generateScriptWithTechnicalSheetUserPrompt(sourceText);

        const completion = await this.groqService.checkCompletion({
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt },
            ],
            model: 'llama-3.3-70b-versatile',
            jsonMode: true,
        });

        const responseContent = completion.choices[0].message.content;
        if (!responseContent) {
            throw new Error('Failed to generate script from Groq');
        }

        try {
            return JSON.parse(responseContent);
        } catch (error) {
            this.logger.error("Groq response parsing error", error);
            throw new Error('Invalid JSON response from Groq');
        }
    }

    async mapTechnicalSheetToTemplate(sourceText: string, templateJson: string, metadata: any = {}): Promise<any> {
        const truncatedSource = sourceText.length > 30000 ? sourceText.substring(0, 30000) + "...(truncated)" : sourceText;

        const {
            teacherName = "[Nombre del Docente]",
            teacherRole = "[Cargo]",
            teacherSpecialty = "",
            tone = "Formal/Cercano",
            style = "Engage, Connect, Activate",
            studentProfile = "Estudiantes de postgrado",
            courseName = "[Nombre del Curso]"
        } = metadata;

        let templateObj: any = {};
        try {
            templateObj = JSON.parse(templateJson);
        } catch (e) {
            this.logger.warn("Could not parse templateJson, defaulting to 12 scenes", e);
        }
        
        let sceneCount = 0;
        if (templateObj.variables && Array.isArray(templateObj.variables)) {
            const indices = templateObj.variables
                .map((v: any) => {
                    const match = v.label.match(/script_voice_text_scene_(\d+)/);
                    return match ? parseInt(match[1], 10) : 0;
                })
                .filter((n: number) => n > 0);
            
            if (indices.length > 0) {
                sceneCount = Math.max(...indices);
            }
        }

        if (sceneCount === 0) sceneCount = 12;

        this.logger.log(`[ScriptGeneratorService] Detected ${sceneCount} scenes from template variables.`);

        const systemPrompt = Prompts.mapTechnicalSheetToTemplateSystemPrompt(
            courseName, teacherName, teacherRole, teacherSpecialty, studentProfile, tone, style, sceneCount
        );

        const userPrompt = Prompts.mapTechnicalSheetToTemplateUserPrompt(templateJson, truncatedSource);

        const completion = await this.groqService.checkCompletion({
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt },
            ],
            model: 'llama-3.3-70b-versatile',
            jsonMode: true,
        });

        const responseContent = completion.choices[0].message.content;
        if (!responseContent) {
            throw new Error('Failed to generate template script from Groq');
        }

        try {
            return JSON.parse(responseContent);
        } catch (error) {
            this.logger.error("Groq response parsing error", error);
            throw new Error('Invalid JSON response from Groq');
        }
    }
}
