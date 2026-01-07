import { Module } from '@nestjs/common';
import { CoursesController } from './courses.controller';
import { CoursesService } from './courses.service';
import { GroqService } from './groq.service';
import { PrismaService } from '../database/prisma.service';

@Module({
    controllers: [CoursesController],
    providers: [CoursesService, GroqService, PrismaService],
    exports: [GroqService],
})
export class CoursesModule { }
