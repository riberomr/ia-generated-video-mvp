import { Injectable } from '@nestjs/common';
import OpenAI from 'openai';
import { Scene } from '@eduvideogen/shared-types';

@Injectable()
export class GroqService {
    private openai: OpenAI;

    constructor() {
        this.openai = new OpenAI({
            apiKey: process.env.GROQ_API_KEY,
            baseURL: 'https://api.groq.com/openai/v1',
        });
    }

    async generateScript(content: string): Promise<Scene[]> {
        const systemPrompt = `
      You are an expert educational video scriptwriter. 
      Your task is to convert the provided educational content into a structured video script.
      The output must be a valid JSON array of scenes.
      Each scene must have:
      - "text": The spoken script for the avatar.
      - "visual_description": A detailed description of what should be shown on screen (charts, bullet points, stock footage description).
      - "estimated_duration": Estimated duration in seconds.
      
      Keep the tone engaging and educational.
      RETURN ONLY THE JSON. DO NOT WRAP IN MARKDOWN CODE BLOCKS.
    `;

        const completion = await this.openai.chat.completions.create({
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: content },
            ],
            model: 'llama-3.3-70b-versatile',
            response_format: { type: 'json_object' },
        });

        const responseContent = completion.choices[0].message.content;
        if (!responseContent) {
            throw new Error('Failed to generate script from Groq');
        }

        try {
            const parsed = JSON.parse(responseContent);
            // Handle case where LLM might wrap it in a root key like "scenes"
            return Array.isArray(parsed) ? parsed : parsed.scenes || [];
        } catch (error) {
            console.error("Groq response parsing error", error);
            throw new Error('Invalid JSON response from Groq');
        }
    }
}
