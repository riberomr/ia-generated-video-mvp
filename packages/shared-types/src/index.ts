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

export interface UpdateScriptDto {
    scenes: Scene[];
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
    createdAt: Date;
    updatedAt: Date;
}

export interface RenderedVideo {
    id: string;
    scriptId: string;
    status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
    externalId?: string;
    downloadUrl?: string;
    createdAt: Date;
    updatedAt: Date;
}
