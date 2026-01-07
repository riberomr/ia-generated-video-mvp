import { Module } from '@nestjs/common';
import { VideosController } from './videos.controller';
// import { HeyGenService } from './heygen.service';
import { SynthesiaService } from './synthesia.service';
import { PrismaService } from '../database/prisma.service';
import { CoursesModule } from '../courses/courses.module';

@Module({
    imports: [CoursesModule],
    controllers: [VideosController],
    providers: [
        // HeyGenService, 
        SynthesiaService, PrismaService],
    exports: [
        // HeyGenService,
        SynthesiaService],
})
export class VideosModule { }
