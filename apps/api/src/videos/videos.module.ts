import { Module } from "@nestjs/common";
import { VideosController } from "./videos.controller";
import { SynthesiaService } from "./synthesia.service";
import { PrismaService } from "../database/prisma.service";
import { FileExtractionService } from "./file-extraction.service";

@Module({
  imports: [],
  controllers: [VideosController],
  providers: [SynthesiaService, PrismaService, FileExtractionService],
  exports: [SynthesiaService, FileExtractionService],
})
export class VideosModule {}
