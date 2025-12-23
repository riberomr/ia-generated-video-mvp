import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { VideosModule } from './videos/videos.module';
import { CoursesController } from './courses/courses.controller';
import { CoursesService } from './courses/courses.service';
import { GroqService } from './courses/groq.service';
import { VideoGenerationService } from './courses/video-generation.service';
import { PrismaService } from './database/prisma.service';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            envFilePath: ['.env', '../../.env'], // Look in api root and monorepo root
        }),
        VideosModule
    ],
    controllers: [CoursesController],
    providers: [CoursesService, GroqService, VideoGenerationService, PrismaService],
})
export class AppModule { }
