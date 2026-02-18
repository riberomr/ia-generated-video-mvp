export interface AiScript {
    id: string;
    title: string;
    courseName?: string;
    teacherName?: string;
    teacherRole?: string;
    teacherSpecialty?: string;
    studentProfile?: string;
    videoType?: string;
    tone?: string;
    style?: string;
    templateData: any;
    templateId?: string;
    status: string;
    createdAt: Date;
    updatedAt: Date;
    isDeleted: boolean;
    files: any[]; // Adjust type as needed
    videos?: VideoRender[];
}

export interface VideoRender {
    id: string;
    scriptId: string;
    externalId: string;
    status: string;
    isDeleted: boolean;
    createdAt: Date;
    updatedAt: Date;
    downloadUrl?: string; // Optional if not in prisma schema explicitly but used in logic
}

export interface AiScriptRepository {
    create(data: any): Promise<AiScript>;
    findById(id: string): Promise<AiScript | null>;
    findAll(): Promise<AiScript[]>;
    updateStatus(id: string, status: string): Promise<void>;
    update(id: string, data: any): Promise<AiScript>;
    
    // Video Render Methods
    createVideoRender(data: any): Promise<VideoRender>;
    findVideoRenderById(id: string): Promise<VideoRender | null>;
    updateVideoRender(id: string, data: any): Promise<VideoRender>;
}
