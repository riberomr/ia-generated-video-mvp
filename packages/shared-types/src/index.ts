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

export enum SynthesiaVisibility {
    PRIVATE = 'private',
    PUBLIC = 'public',
}

export enum SynthesiaAspectRatio {
    WIDESCREEN = '16:9',
    VERTICAL = '9:16',
    SQUARE = '1:1',
    PORTRAIT_4_5 = '4:5',
    PORTRAIT_5_4 = '5:4',
}

export enum SynthesiaSoundtrack {
    CORPORATE = 'corporate',
    INSPIRATIONAL = 'inspirational',
    MODERN = 'modern',
    URBAN = 'urban',
}

export interface SynthesiaAvatarSettings {
    voice?: string;
    horizontalAlign?: 'left' | 'center' | 'right';
    scale?: number;
    style?: 'rectangular' | 'circular';
    backgroundColor?: string;
    seamless?: boolean;
}

export interface SynthesiaVideoSettings {
    shortBackgroundContentMatchMode?: 'freeze' | 'loop' | 'slow_down';
    longBackgroundContentMatchMode?: 'trim' | 'speed_up';
}

export interface SynthesiaBackgroundSettings {
    videoSettings?: SynthesiaVideoSettings;
}

export interface SynthesiaInputScene {
    scriptText: string;
    scriptAudio?: string;
    scriptLanguage?: string;
    avatar: string;
    background: string;
    avatarSettings?: SynthesiaAvatarSettings;
    backgroundSettings?: SynthesiaBackgroundSettings;
}

export interface CreateVideoFromScratchPayload {
    test?: boolean;
    title: string;
    description?: string;
    visibility: SynthesiaVisibility | string;
    aspectRatio: SynthesiaAspectRatio | string;
    soundtrack?: SynthesiaSoundtrack | string;
    callbackId?: string;
    input: SynthesiaInputScene[];
    ctaSettings?: {
        label: string;
        url: string;
    };
}
export enum SceneObjective {
    HOOK = 'hook',
    EDUCATIONAL = 'educational',
    CTA = 'call_to_action',
    TRANSITION = 'transition',
    JOKE = 'joke'
}

export enum SceneComplexity {
    CHILD = 'child',
    GENERAL = 'general',
    TECHNICAL = 'technical',
    ACADEMIC = 'academic'
}

export enum ScenePOV {
    FIRST_PERSON = 'first_person', // I/We
    SECOND_PERSON = 'second_person', // You
    THIRD_PERSON = 'third_person' // They/The System
}
