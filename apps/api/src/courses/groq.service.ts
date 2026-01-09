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
    // async generateSynthesiaScript(topic: string, templateJson: string): Promise<any> {
    //     const systemPrompt = `
    //     # Role & Objective
    //     You are an expert video scriptwriter and data structurer.
    //     Your goal is to generate content that fits PERFECTLY into a specific Synthesia Video Template.

    //     # Input Data
    //     You will receive a JSON object representing a "Synthesia Template".
    //     The user wants a video about a specific **TOPIC**.

    //     **Template Structure Analysis Rules:**
    //     1. **Scene Count:** The description field ends with a phrase like "X scenes total". You MUST extract this integer to know how many scenes the video has.
    //     2. **Visual Variables:** The variables array contains the placeholders we need to fill.
    //     - Look for items where type is "string".
    //     - The label is the Key you must use in your output.
    //     - Ignore type: "image" or type: "actor" unless you are providing alt-text context.
    //     3. **Logic:**
    //     - If you see variables like agenta_text_1, agenta_text_2, ..., agenta_text_5, you MUST generate exactly 5 bullet points.
    //     - If you see title_scene1 and title_scene2, you must generate titles specifically for those scenes.

    //     # Instructions for Generation
    //     1. **Analyze the Topic:** Create a cohesive narrative based on the user's topic.
    //     2. **Distribute the Script:** Split the spoken narrative (what the avatar says) into the number of scenes found in the description.
    //     3. **Fill the Visuals:** map your content to the strict list of labels found in the variables array.

    //     # Output Format (Strict JSON)
    //     Return ONLY a JSON object. Do not include markdown formatting or explanations.
    //     The JSON must have this exact structure:

    //     {
    //     "meta": {
    //         "topic": "The user topic",
    //         "detected_scenes": 3
    //     },
    //     "template_data": {
    //         "title_scene1": "Generated Title for S1",
    //         "subtitle_scene1": "Generated Subtitle for S1",
    //         "title_scene2": "Generated Title for S2",
    //         "agenta_text_1": "Point 1",
    //         "agenta_text_2": "Point 2",
    //         ... (Fill ALL string variables found in input)
    //     }
    //     }
    //             `;

    //     const userPrompt = `
    //     # Your Turn
    //     Generate the JSON for the Topic: "${topic}"
    //     Using this Template JSON:
    //     ${templateJson}
    //             `;

    //     const completion = await this.openai.chat.completions.create({
    //         messages: [
    //             { role: 'system', content: systemPrompt },
    //             { role: 'user', content: userPrompt },
    //         ],
    //         model: 'llama-3.3-70b-versatile',
    //         response_format: { type: 'json_object' },
    //     });

    //     const responseContent = completion.choices[0].message.content;
    //     if (!responseContent) {
    //         throw new Error('Failed to generate Synthesia script from Groq');
    //     }

    //     try {
    //         return JSON.parse(responseContent);
    //     } catch (error) {
    //         console.error("Groq response parsing error", error);
    //         throw new Error('Invalid JSON response from Groq for Synthesia script');
    //     }
    // }
    async analyzeAndMapScript(topic: string, sourceText: string, templateJson: string, sceneCount: number): Promise<any> {

        // 1. CALCULAMOS EL ÍNDICE EXACTO EN TYPESCRIPT (Más robusto)
        // Si son 5 escenas, la anteúltima es la 4.
        const calendarSceneIndex = sceneCount > 1 ? sceneCount - 1 : 1;

        const systemPrompt = `
    # Role & Objective
    You are an expert Video Editor and Scriptwriter.
    Your goal is to transform a "Source Text" into a perfectly mapped Video Script for a specific Synthesia Template.

    # Input Data
    1. **Source Text**: The raw content (article, notes, docs) provided by the user.
    2. **Template Structure**: A JSON array where each object contains an "id", a "label", and optionally a "value".
    3. **Scene Count**: The target number of scenes (${sceneCount}).

    # Misión
    1. **Analyze**: Read the Source Text and extract the most important concepts matching the User's Topic: "${topic}".
    
    2. **DETECT CALENDAR DATA (CRITICAL)**: 
    - Scan the source text specifically for dates, schedules, deadlines, or timeline steps.
    - IF found: You MUST reserve **Scene #${calendarSceneIndex}** specifically for this calendarization info.
    - IF NOT found: Generate Scene #${calendarSceneIndex} as normal narrative content.

    3. **Distribute Script**: detailed narrative text for the avatar to speak.
    - You MUST generate exactly ${sceneCount} blocks of text.
    - Each text generated will be spoken by the avatar in a different scene, saved in the variable "scene_voice_text_n".
    - **Scene #${calendarSceneIndex} Rule**: If calendar data exists, the text for "scene_voice_text_${calendarSceneIndex}" must focus strictly on the dates/schedule.

    4. **Fill Visuals**: Extract phrases, keywords, or short titles from the Source Text to fill the "template_data".
    - If variables are named "agenta_text_1", "agenta_text_2", find 2 distinct points.
    - If variables are "title_scene1", generate a relevant title for that scene.
    - If variables are "scene_voice_text_1", "scene_voice_text_2", you fill the content of the variable with the text generated in the previous step.
    - If variables are "list_item_title_1", "list_item_title_2", find 2 distinct points.
    - If variables are "list_item_description_1", "list_item_description_2", find 2 distinct points, related to the points found in the previous step.


    # Rules
    - **KEY NAMING (Critical)**: When creating the output JSON, the key MUST be the content of the "label" field from the input (e.g., "logo_empresa"), NOT the "id" (UUID).
    
    - **PRE-FILLED VALUES (Priority)**: Check each input variable in "Template Structure":
        - IF the variable already has a "value" (e.g., an image ID, a default color, or text), YOU MUST USE THAT EXACT VALUE in your output. Do not overwrite it with generated text or spaces.
        - ELSE (if "value" is missing or null), generate the content from Source Text or use " " if empty.

    - **Constraint**: If the template asks for X items (e.g. 5 bullets) but the source text only justifies Y items (e.g. 3), fill the remaining X-Y items with a single space " ".
    - **ALL Variables Required**: You MUST include every single key found in the "Template Structure" in your output JSON. Missing keys will cause a crash.
    - **Conditional Logic**: If the source text does not provide enough information to fill a specific variable, AND the variable does not have a pre-filled value, YOU MUST fill it with a single space " " (do not use null or omit the key).
    - **Tone**: Professional, clear, and engaging.
    - **Output**: STRICT JSON. No markdown.

    # Output JSON Structure
    {
    "meta": {
        "topic": "${topic}",
        "detected_scenes": ${sceneCount},
        "calendar_scene_applied": boolean
    },
    "template_data": {
        "variable_name": "Extracted Content",
        ...
    }
    }
    `;

        const userPrompt = `
        # Source Text
        ${sourceText}

        # Template Structure (Variables)
        ${templateJson}

        # Generate the JSON
        `;

        const completion = await this.openai.chat.completions.create({
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt },
            ],
            model: 'llama-3.3-70b-versatile',
            response_format: { type: 'json_object' },
        });

        const responseContent = completion.choices[0].message.content;
        if (!responseContent) {
            throw new Error('Failed to analyze and map script from Groq');
        }

        try {
            return JSON.parse(responseContent);
        } catch (error) {
            console.error("Groq response parsing error", error);
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
        const systemPrompt = `
      Eres un experto guionista de videos educativos y un generador de JSON estricto.
      Tu salida debe ser UNICAMENTE un objeto JSON compatible con la estructura requerida.
      
      Estructura de Salida (JSON):
      {
        "title": string,
        "description": string,
        "visibility": "private",
        "input": [
           { 
             "scriptText": string, 
             "avatar": "anna_costume1_cameraA", 
             "background": "green_screen",
             "avatarSettings": { "horizontalAlign": "center", "scale": 1.0, "style": "rectangular", "seamless": false },
             "backgroundSettings": { "videoSettings": { "shortBackgroundContentMatchMode": "freeze", "longBackgroundContentMatchMode": "trim" } },
             "metadata": {
                "scene_index": number,
                "topic": string,
                "duration_sec": number,
                "emotion": string,
                "visual_context": string
             }
           }
        ]
      }
      
      Reglas Generales:
      1. El array "input" debe tener EXACTAMENTE ${sceneCount} elementos.
      2. "avatar" siempre "anna_costume1_cameraA" y "background" siempre "green_screen".
      
      Reglas de Generación de Guion (CRÍTICO - EMOCIÓN EN EL TEXTO):
      1. **Duración**: Respeta la duración indicada (aprox 150 palabras/minuto).
      2. **Emoción**: El avatar NO tiene expresiones faciales controlables. **LA EMOCIÓN DEBE ESTAR EN EL TEXTO**.
         - Si es 'excited': Usa exclamaciones, frases cortas, palabras energéticas.
         - Si es 'serious': Usa lenguaje formal, frases estructuradas, tono calmado.
         - Si es 'empathetic': Usa palabras suaves, preguntas retóricas, conexión personal.
      3. **Visuales**: Si se provee 'visual_context', úsalo para referencias ("Como vemos aquí...").
      4. **Complejidad**: Adapta el vocabulario ('child' = simple, 'technical' = jerga técnica).
      5. **POV**: Respeta estrictamente los pronombres (First Person = "Yo/Nosotros", Second Person = "Tú").
      6. **Keywords**: Debes incluir las keywords obligatorias de forma natural.
      `;

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

        const userPrompt = `
      Contexto Base: ${sourceText}

      Título del Video: "${title}"
      Cantidad de Escenas: ${sceneCount}

      Instrucciones Específicas por Escena:
      ${scenesDescription}

      Genera el JSON completo:
      `;

        const completion = await this.openai.chat.completions.create({
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt },
            ],
            model: 'llama-3.3-70b-versatile',
            response_format: { type: 'json_object' },
        });

        const responseContent = completion.choices[0].message.content;
        if (!responseContent) {
            throw new Error('Failed to generate script from Groq');
        }

        try {
            return JSON.parse(responseContent);
        } catch (error) {
            console.error("Groq response parsing error", error);
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

        // 150 palabras por minuto / 60 segundos = 2.5 palabras por segundo
        const wordsPerSecond = 2.5;
        const targetWordCount = Math.floor(currentSceneData.duration * wordsPerSecond);

        // Damos un margen de error pequeño (+10 palabras) pero somos estrictos en el prompt
        const maxWordLimit = targetWordCount + 10;

        const systemPrompt = `
    You are an expert Script Editor known for brevity and precision.
    Your task is to REWRITE a single scene (Scene #${targetSceneIndex + 1}) based on User Feedback.
    
    CRITICAL RULE: The output must strictly adhere to the duration constraints. 
    Verbose or overly long scripts will cause the video generation to fail.
    
    The output must be a valid JSON object representing ONLY the SINGLE regenerated scene.
    Do NOT return an array.
    
    Structure:
    { 
            "scriptText": string, 
            "avatar": "anna_costume1_cameraA", 
            "background": "green_screen",
            "avatarSettings": { ... },
            "backgroundSettings": { ... },
            "metadata": { ... }
    }
`;

        const scenesSummary = allScenes.map((s, i) => `Scene ${i + 1}: ${s.topic} - ${s.scriptText?.substring(0, 50)}...`).join('\n');

        const userPrompt = `
    # Context
    Source Material: "${sourceContentText}"
    
    # Scenes Summary (To avoid repetition)
    ${scenesSummary}

    # The Scene to Fix (Scene Index: ${targetSceneIndex})
    Current Config: 
    - **Topic:** "${currentSceneData.topic}"
      - **Objective:** "${currentSceneData.objective || 'educational'}" (Guide by this: Hook -> Attractive; CTA -> Clear Action).
      - **Complexity:** "${currentSceneData.complexity || 'general'}"
      - **POV:** "${currentSceneData.pov || 'second_person'}"
      - **Emotion:** "${currentSceneData.emotion || 'neutral'}" (Remember: reflect this in the tone and punctuation).
      - **Duration:** ${currentSceneData.duration || 10} seconds.
      - **Visual Context:** "${currentSceneData.visual_context || 'N/A'}"
      - **Keywords:** ${currentSceneData.keywords && currentSceneData.keywords.length > 0 ? currentSceneData.keywords.join(', ') : 'N/A'}
    
    # LENGTH CONSTRAINTS (STRICT)
    - Allocated Duration: ${currentSceneData.duration} seconds.
    - Target Word Count: ~${targetWordCount} words.
    - MAXIMUM ALLOWED WORDS: ${maxWordLimit} words.
    
    Previous Script (Reference ONLY - Do not expand on this):
    "${currentSceneData.scriptText}"

    # User Feedback:
    "${userFeedback ? userFeedback : "Update script to match the provided Topic/Config."}"

    # Instructions
    1. Rewrite the scriptText to address the feedback.
    2. STRICTLY respect the ${maxWordLimit} word limit. If the feedback requires adding information, you must REMOVE other less important details to keep the balance.
    3. Do NOT make the text longer than the Previous Script unless the previous script was too short.
    4. Maintain the tone defined in '${currentSceneData.emotion}'.
    5. Do not simply append sentences. Rephrase the entire paragraph to be concise.
`;

        const completion = await this.openai.chat.completions.create({
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt },
            ],
            model: 'llama-3.3-70b-versatile',
            response_format: { type: 'json_object' },
        });

        const responseContent = completion.choices[0].message.content;
        if (!responseContent) {
            throw new Error('Failed to regenerate scene from Groq');
        }

        try {
            return JSON.parse(responseContent);
        } catch (error) {
            console.error("Groq response parsing error", error);
            throw new Error('Invalid JSON response from Groq');
        }
    }
}
