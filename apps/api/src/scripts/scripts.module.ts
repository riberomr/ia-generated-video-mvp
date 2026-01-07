import { Module } from '@nestjs/common';
import { ScriptsController } from './scripts.controller';
import { ScriptsService } from './scripts.service';
import { PrismaService } from '../database/prisma.service';
import { CoursesModule } from '../courses/courses.module';
import { VideosModule } from '../videos/videos.module';

@Module({
    imports: [CoursesModule, VideosModule], // CoursesModule exports GroqService, VideosModule exports SynthesiaService
    controllers: [ScriptsController],
    providers: [ScriptsService, PrismaService],
})
export class ScriptsModule { }
