export interface Scene {
    text: string;
    visual_description: string;
    estimated_duration: number; // in seconds
}

export interface VideoScript {
    scenes: Scene[];
}

export interface CreateCourseDto {
    topic: string;
    content: string;
}

export interface SynthesiaTemplate {
    id: string;
    title: string;
    description?: string;
    thumbnail_url?: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface SynthesiaTemplateDetails extends SynthesiaTemplate {
    variables?: Record<string, any>;
}

export interface SynthesiaAsset {
    id: string;
    title: string;
    type: string; // 'image', 'video', 'audio', etc.
    url: string;
}

export interface UpdateScriptDto {
    scenes: Scene[] | string[];
    templateData?: Record<string, any>;
    isTemplated?: boolean;
}

export enum ScriptStatus {
    DRAFT = 'DRAFT',
    PUBLISHED = 'PUBLISHED',
    ARCHIVED = 'ARCHIVED',
}

export interface Course {
    id: string;
    topic: string;
    rawContent: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface Script {
    id: string;
    courseId: string;
    scenes: Scene[];
    status: ScriptStatus;
    originalScenes: Scene[];
    isTemplated: boolean;
    templateId?: string;
    templateData?: Record<string, any>;
    createdAt: Date;
    updatedAt: Date;
}

export interface CreateScriptDto {
    courseId: string;
    scenes: Scene[] | string[]; // Can be standard Scene objects or simple strings for voice
    templateData?: Record<string, any>;
    templateId?: string;
    isTemplated?: boolean;
}

export interface RenderedVideo {
    id: string;
    scriptId: string;
    status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
    externalId?: string;
    downloadUrl?: string;
    provider?: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface AnalyzeScriptDto {
    templateId: string;
    topic: string;
    sourceText: string;
}

export interface SmartScriptResponse {
    meta: {
        topic: string;
        detected_scenes: number;
    };
    template_data: Record<string, string>;
}
