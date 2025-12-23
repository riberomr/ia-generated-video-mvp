import { Injectable } from '@nestjs/common';
import { CreateCourseDto } from '@eduvideogen/shared-types';
import { GroqService } from './groq.service';
import { VideoGenerationService } from './video-generation.service';
import { PrismaService } from '../database/prisma.service';
import { Prisma } from '@eduvideogen/database';

@Injectable()
export class CoursesService {
    constructor(
        private readonly groqService: GroqService,
        private readonly videoGenService: VideoGenerationService,
        private readonly prisma: PrismaService,
    ) { }

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
                scenes: scenes as unknown as Prisma.JsonArray, // Casting for Prisma Json type
            }
        });

        return {
            courseId: course.id,
            scriptId: script.id,
            courseTopic: course.topic,
            generatedScript: scenes,
        };
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
