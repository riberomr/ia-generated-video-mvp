import { Injectable } from '@nestjs/common';
import OpenAI from 'openai';

@Injectable()
export class GroqService {
    private openai: OpenAI;

    constructor() {
        this.openai = new OpenAI({
            apiKey: process.env.GROQ_API_KEY,
            baseURL: 'https://api.groq.com/openai/v1',
        });
    }

    async checkCompletion(config: {
        messages: any[];
        model?: string;
        jsonMode?: boolean;
    }): Promise<any> {
        const { messages, model = 'llama-3.3-70b-versatile', jsonMode = false } = config;

        try {
            const completion = await this.openai.chat.completions.create({
                messages,
                model,
                response_format: jsonMode ? { type: 'json_object' } : undefined,
            });

            return completion;
        } catch (error) {
            console.error("Groq API error", error);
            throw new Error('Failed to complete request with Groq');
        }
    }
}
