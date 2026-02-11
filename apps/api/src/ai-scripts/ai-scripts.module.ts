import { Module } from "@nestjs/common";
import { AiScriptsService } from "./ai-scripts.service";
import { AiScriptsController } from "./ai-scripts.controller";
import { PrismaService } from "../database/prisma.service";
import { VideosModule } from "../videos/videos.module";
import { GroqService } from "./groq.service";

@Module({
  imports: [VideosModule],
  controllers: [AiScriptsController],
  providers: [AiScriptsService, PrismaService, GroqService],
})
export class AiScriptsModule {}
