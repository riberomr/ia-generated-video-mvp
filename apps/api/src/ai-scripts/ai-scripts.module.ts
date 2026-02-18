import { Module } from "@nestjs/common";
import { AiScriptsService } from "./ai-scripts.service";
import { AiScriptsController } from "./ai-scripts.controller";
import { PrismaService } from "../database/prisma.service";
import { VideosModule } from "../videos/videos.module";
import { GroqService } from "./groq.service";
import { BedrockService } from "./bedrock.service";

@Module({
  imports: [VideosModule],
  controllers: [AiScriptsController],
  providers: [AiScriptsService, PrismaService, GroqService, BedrockService],
})
export class AiScriptsModule {}
