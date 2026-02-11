import {
  Injectable,
  Logger,
  InternalServerErrorException,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../database/prisma.service";

@Injectable()
export class SynthesiaService {
  private readonly logger = new Logger(SynthesiaService.name);
  private readonly apiKey = process.env.SYNTHESIA_API_KEY;
  private readonly baseUrl = "https://api.synthesia.io/v2";

  constructor(private readonly prisma: PrismaService) {
    if (!process.env.SYNTHESIA_API_KEY) {
      this.logger.warn("SYNTHESIA_API_KEY is missing.");
    }
  }

  private async fetchFromSynthesia(
    endpoint: string,
    options: RequestInit = {},
  ) {
    const url = `${this.baseUrl}${endpoint}`;
    this.logger.log(`Calling Synthesia API: ${url}`);

    const res = await fetch(url, {
      ...options,
      headers: {
        Authorization: `${this.apiKey}`,
        Accept: "application/json",
        ...(options.method !== "GET"
          ? { "Content-Type": "application/json" }
          : {}),
        ...options.headers,
      },
    });

    const text = await res.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      this.logger.error(
        `Synthesia API Non-JSON Response [${endpoint}]: ${text.substring(0, 500)}`,
      );
      throw new InternalServerErrorException(
        `Synthesia API returned invalid format: ${res.status} ${res.statusText}`,
      );
    }

    if (!res.ok) {
      this.logger.error(
        `Synthesia API Error [${endpoint}]: ${JSON.stringify(data)}`,
      );
      throw new InternalServerErrorException(
        `Synthesia API call failed: ${data.message || res.statusText}`,
      );
    }

    return data;
  }

  async listTemplates(source?: string) {
    // Construir query params si source está presente
    const queryParams = source ? `?source=${source}` : "";
    const endpoint = `/templates${queryParams}`;

    const response = await this.fetchFromSynthesia(endpoint);
    return response.templates || response || [];
  }

  async getTemplate(id: string) {
    return this.fetchFromSynthesia(`/templates/${id}`);
  }

  async generateVideo(scriptId: string, testMode: boolean = false) {
    const script = await this.prisma.aiScript.findUnique({
      where: { id: scriptId },
    });

    if (!script) {
      throw new NotFoundException(`AiScript ${scriptId} not found`);
    }

    const payload: any = {
      test: testMode,
      title: script.title,
      description: `Generated from AiScript ${script.id}`,
    };

    let endpoint = "/videos";

    // 1. Check if it's a template-based generation
    if (script.templateId) {
      endpoint = "/videos/fromTemplate";
      payload.templateId = script.templateId;
      payload.templateData = script.templateData;
    } else {
      // Fallback or Basic generation (if we implemented it)
      // For now, if no templateId, we can't generate with this flow easily unless we map avatars/voices
      // But let's assume all are templates as per MVP
      throw new InternalServerErrorException(
        "Script missing template configuration",
      );
    }

    this.logger.log(
      `Generating video [${endpoint}] for script ${script.id} [Test: ${testMode}]`,
    );

    let response;
    try {
      response = await this.fetchFromSynthesia(endpoint, {
        method: "POST",
        body: JSON.stringify(payload),
      });
    } catch (e) {
      this.logger.error("Synthesia Generation Failed", e);
      throw e;
    }

    const externalId = response.id;
    return this.prisma.videoRender.create({
      data: {
        scriptId: script.id,
        externalId: externalId,
        status: "PENDING",
      },
    });
  }

  async getVideoStatus(externalId: string) {
    const response = await this.fetchFromSynthesia(`/videos/${externalId}`);
    return response;
  }

  async updateVideoStatus(videoRenderId: string) {
    const video = await this.prisma.videoRender.findUnique({
      where: { id: videoRenderId },
    });

    if (!video || !video.externalId) {
      throw new NotFoundException(
        "VideoRender not found or missing externalId",
      );
    }

    const response = await this.getVideoStatus(video.externalId);
    const status = response.status; // created, queued, in_progress, complete

    let newStatus = video.status;
    if (status === "complete") newStatus = "COMPLETED";
    else if (status === "in_progress") newStatus = "PROCESSING";
    else if (["created", "queued"].includes(status)) newStatus = "PENDING";
    else if (status === "failed" || status === "error") newStatus = "FAILED";

    return this.prisma.videoRender.update({
      where: { id: videoRenderId },
      data: {
        status: newStatus,
      },
    });
  }

  async softDeleteVideo(videoRenderId: string) {
    return this.prisma.videoRender.update({
      where: { id: videoRenderId },
      data: { isDeleted: true },
    });
  }
}
