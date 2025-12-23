import { Module } from '@nestjs/common';
import { VideosController } from './videos.controller';
import { HeyGenService } from './heygen.service';
import { PrismaService } from '../database/prisma.service';

@Module({
    controllers: [VideosController],
    providers: [HeyGenService, PrismaService],
    exports: [HeyGenService],
})
export class VideosModule { }
