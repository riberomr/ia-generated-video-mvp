import { Injectable } from '@nestjs/common';
import { CreateCourseDto, UpdateScriptDto } from '@eduvideogen/shared-types';
import { GroqService } from './groq.service';
import { PrismaService } from '../database/prisma.service';
import { Prisma } from '@eduvideogen/database';

@Injectable()
export class CoursesService {
    constructor(
        private readonly groqService: GroqService,
        private readonly prisma: PrismaService,
    ) { }

    async createCourse(dto: CreateCourseDto) {
        return this.prisma.course.create({
            data: {
                topic: dto.topic,
                rawContent: dto.content,
            },
        });
    }

    async generateScript(dto: CreateCourseDto) {
        // 1. Generate Script using OpenAI
        const scenes = await this.groqService.generateScript(dto.content);

        // 2. Save to DB
        // Save Course
        const course = await this.prisma.course.create({
            data: {
                topic: dto.topic,
                rawContent: dto.content,
            },
        });

        // 3. Save Script
        const script = await this.prisma.script.create({
            data: {
                courseId: course.id,
                scenes: scenes as unknown as Prisma.JsonArray,
                originalScenes: scenes as unknown as Prisma.JsonArray,
                status: 'DRAFT',
            }
        });

        return {
            courseId: course.id,
            scriptId: script.id,
            courseTopic: course.topic,
            generatedScript: scenes,
        };
    }

    async updateScript(id: string, dto: UpdateScriptDto) {
        // Prepare Data
        const data: any = { status: 'PUBLISHED' };

        if (dto.isTemplated) {
            if (dto.templateData) data.templateData = dto.templateData;
            // If templated, 'scenes' usually contains voice script strings
            // If templated, 'scenes' usually contains voice script strings,
            // but we don't store them in a separate voiceScript column anymore.
            // They should be in templateData or just stored in scenes as JSON if needed for legacy compatibility.
            // data.scenes is already handled in the else block if not templated, but here?
            // If we want to save the scene text list, we can put it in 'scenes'.
            if (Array.isArray(dto.scenes)) {
                data.scenes = dto.scenes;
            }
        } else {
            // Standard update
            data.scenes = dto.scenes as unknown as Prisma.JsonArray;
        }

        const script = await this.prisma.script.update({
            where: { id },
            data: data
        });
        return script;
    }

    async getScript(id: string) {
        return this.prisma.script.findUnique({
            where: { id },
            include: { course: true }
        });
    }

    async findAll(): Promise<Prisma.CourseGetPayload<{
        include: {
            scripts: {
                include: {
                    videos: true
                }
            }
        }
    }>[]> {
        return this.prisma.course.findMany({
            include: {
                scripts: {
                    include: {
                        videos: true // Include RenderedVideos
                    }
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
        });
    }
}
