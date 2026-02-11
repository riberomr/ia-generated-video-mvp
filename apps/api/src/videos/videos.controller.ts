import {
  Controller,
  Post,
  Get,
  Param,
  Res,
  NotFoundException,
  Delete,
  Body,
  Query,
} from "@nestjs/common";
import { Response } from "express";
import { SynthesiaService } from "./synthesia.service";

@Controller("videos")
export class VideosController {
  constructor(private readonly synthesiaService: SynthesiaService) {}

  @Get("templates")
  async getSynthesiaTemplates(@Query("source") source?: string) {
    return this.synthesiaService.listTemplates(source);
  }

  @Get("templates/:id")
  async getSynthesiaTemplateDetails(@Param("id") id: string) {
    return this.synthesiaService.getTemplate(id);
  }

  @Post("generate/:scriptId")
  async generateVideo(
    @Param("scriptId") scriptId: string,
    @Body() body: { test?: boolean },
  ) {
    return this.synthesiaService.generateVideo(scriptId, body.test);
  }

  @Get("status/:videoId")
  async checkStatus(@Param("videoId") videoId: string) {
    return this.synthesiaService.updateVideoStatus(videoId);
  }

  @Delete(":videoId")
  async deleteVideo(@Param("videoId") videoId: string) {
    return this.synthesiaService.softDeleteVideo(videoId);
  }

  @Get(":videoId/download-url")
  async getVideoDownloadUrl(
    @Param("videoId") videoId: string,
    @Res() res: Response,
  ) {
    try {
      // 1. Update status in DB (and get the video record)
      const video = await this.synthesiaService.updateVideoStatus(videoId);

      // 2. Check if externalId exists
      if (!video.externalId) {
        return res.status(404).json({ message: "Video external ID missing" });
      }

      // 3. Get fresh data from Synthesia using externalId
      const synthesiaData = await this.synthesiaService.getVideoStatus(
        video.externalId,
      );

      // 4. Return the download URL
      if (synthesiaData.download) {
        return res.json({
          downloadUrl: synthesiaData.download,
          status: synthesiaData.status,
        });
      }

      return res.status(404).json({
        message: "Video download URL not available yet",
        status: synthesiaData.status,
      });
    } catch (e) {
      console.error("Download URL fetch error:", e);
      return res
        .status(500)
        .json({ message: "Error communicating with Synthesia" });
    }
  }
}
