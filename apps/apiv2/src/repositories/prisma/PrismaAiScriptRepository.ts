import { PrismaClient } from "@prisma/client";
import { AiScript, AiScriptRepository, VideoRender } from "../IAiScriptRepository";

let prisma: PrismaClient | null = null;

function getPrisma() {
    if (!prisma) {
        prisma = new PrismaClient();
    }
    return prisma;
}

export class PrismaAiScriptRepository implements AiScriptRepository {
    async create(data: any): Promise<AiScript> {
        return getPrisma().aiScript.create({ data }) as unknown as AiScript;
    }

    async findById(id: string): Promise<AiScript | null> {
        return getPrisma().aiScript.findUnique({ 
            where: { id },
            include: { videos: true }
        }) as unknown as AiScript | null;
    }

    async findAll(): Promise<AiScript[]> {
        return getPrisma().aiScript.findMany({
            orderBy: { createdAt: "desc" },
            include: { videos: true }
        }) as unknown as AiScript[];
    }

    async updateStatus(id: string, status: string): Promise<void> {
        await getPrisma().aiScript.update({
            where: { id },
            data: { status }
        });
    }

    async update(id: string, data: any): Promise<AiScript> {
         return getPrisma().aiScript.update({
            where: { id },
            data
        }) as unknown as AiScript;
    }

    // Video Render Implementation
    async createVideoRender(data: any): Promise<VideoRender> {
        return getPrisma().videoRender.create({ data }) as unknown as VideoRender;
    }

    async findVideoRenderById(id: string): Promise<VideoRender | null> {
        return getPrisma().videoRender.findUnique({ where: { id } }) as unknown as VideoRender | null;
    }

    async updateVideoRender(id: string, data: any): Promise<VideoRender> {
        return getPrisma().videoRender.update({
            where: { id },
            data
        }) as unknown as VideoRender;
    }
}
