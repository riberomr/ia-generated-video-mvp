import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseInterceptors,
  UploadedFiles,
} from "@nestjs/common";
import { AiScriptsService } from "./ai-scripts.service";
import { Prisma } from "@prisma/client";
import { FilesInterceptor } from "@nestjs/platform-express";

@Controller("ai-scripts")
export class AiScriptsController {
  constructor(private readonly aiScriptsService: AiScriptsService) {}

  @Post()
  create(@Body() createAiScriptDto: Prisma.AiScriptCreateInput) {
    return this.aiScriptsService.create(createAiScriptDto);
  }

  @Post("generate-from-files")
  @UseInterceptors(FilesInterceptor("files"))
  async generateFromFiles(
    @UploadedFiles() files: Array<Express.Multer.File>,
    @Body() body: any,
  ) {
    return this.aiScriptsService.generateFromFiles(files, body);
  }

  @Post(":id/regenerate-scene")
  async regenerateScene(
    @Param("id") id: string,
    @Body()
    body: { sceneNumber: number; currentScript: any; userInstruction: string },
  ) {
    const { sceneNumber, currentScript, userInstruction } = body;
    return this.aiScriptsService.regenerateScene(
      id,
      sceneNumber,
      currentScript,
      userInstruction,
    );
  }

  @Get()
  findAll() {
    return this.aiScriptsService.findAll();
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.aiScriptsService.findOne(id);
  }

  @Patch(":id")
  update(
    @Param("id") id: string,
    @Body() updateAiScriptDto: Prisma.AiScriptUpdateInput,
  ) {
    return this.aiScriptsService.update(id, updateAiScriptDto);
  }

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.aiScriptsService.remove(id);
  }
}
