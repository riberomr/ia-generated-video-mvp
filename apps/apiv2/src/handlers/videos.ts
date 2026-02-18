import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { getPrisma } from "../lib/prisma";
import * as synthesia from "../lib/synthesia";
import { ok, created, notFound, badRequest, serverError } from "../lib/response";

const prisma = getPrisma();

// ── Router ──────────────────────────────────────────────────────────────────
export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  const method = event.httpMethod;
  const path = event.path;
  const scriptId = event.pathParameters?.scriptId;
  const videoId = event.pathParameters?.videoId;

  try {
    // POST /videos/generate/:scriptId
    if (method === "POST" && scriptId && path.includes("/generate/")) {
      return handleGenerateVideo(scriptId, event);
    }

    // GET /videos/status/:videoId
    if (method === "GET" && videoId && path.includes("/status/")) {
      return handleCheckStatus(videoId);
    }

    // GET /videos/:videoId/download-url
    if (method === "GET" && videoId && path.endsWith("/download-url")) {
      return handleDownloadUrl(videoId);
    }

    // DELETE /videos/:videoId
    if (method === "DELETE" && videoId) {
      return handleDeleteVideo(videoId);
    }

    return badRequest("Route not matched");
  } catch (error: any) {
    console.error("videos handler error:", error);
    return serverError(error.message || "Internal server error");
  }
}

// ── Handlers ────────────────────────────────────────────────────────────────

async function handleGenerateVideo(
  scriptId: string,
  event: APIGatewayProxyEvent,
): Promise<APIGatewayProxyResult> {
  const body = JSON.parse(event.body || "{}");
  const testMode = body.test === true;

  const script = await prisma.aiScript.findUnique({ where: { id: scriptId } });
  if (!script) return notFound(`AiScript ${scriptId} not found`);

  if (!script.templateId) {
    return serverError("Script missing template configuration");
  }

  // Build clean template data
  let cleanTemplateData: Record<string, any> = {};
  const templateDataRaw = script.templateData as any;

  if (templateDataRaw?.data) {
    cleanTemplateData = { ...templateDataRaw.data };
  } else {
    cleanTemplateData = { ...templateDataRaw };
  }

  // Set INFO_ variables to space
  Object.keys(cleanTemplateData).forEach((key) => {
    if (key.startsWith("INFO_")) {
      cleanTemplateData[key] = " ";
    }
  });

  const payload = {
    test: testMode,
    title: script.title,
    description: `Generated from AiScript ${script.id}`,
    templateId: script.templateId,
    templateData: cleanTemplateData,
  };

  console.log(`Generating video for script ${script.id} [Test: ${testMode}]`);

  const response = await synthesia.createVideoFromTemplate(payload);

  const videoRender = await prisma.videoRender.create({
    data: {
      scriptId: script.id,
      externalId: response.id,
      status: "PENDING",
    },
  });

  return created(videoRender);
}

async function handleCheckStatus(videoRenderId: string): Promise<APIGatewayProxyResult> {
  const video = await prisma.videoRender.findUnique({
    where: { id: videoRenderId },
  });

  if (!video || !video.externalId) {
    return notFound("VideoRender not found or missing externalId");
  }

  const response = await synthesia.getVideoStatus(video.externalId);
  const status = response.status;

  let newStatus = video.status;
  if (status === "complete") newStatus = "COMPLETED";
  else if (status === "in_progress") newStatus = "PROCESSING";
  else if (["created", "queued"].includes(status)) newStatus = "PENDING";
  else if (status === "failed" || status === "error") newStatus = "FAILED";

  const updated = await prisma.videoRender.update({
    where: { id: videoRenderId },
    data: { status: newStatus },
  });

  return ok(updated);
}

async function handleDownloadUrl(videoRenderId: string): Promise<APIGatewayProxyResult> {
  const video = await prisma.videoRender.findUnique({
    where: { id: videoRenderId },
  });

  if (!video?.externalId) {
    return notFound("Video external ID missing");
  }

  // Update status first
  const statusResponse = await synthesia.getVideoStatus(video.externalId);

  let newStatus = video.status;
  if (statusResponse.status === "complete") newStatus = "COMPLETED";
  else if (statusResponse.status === "in_progress") newStatus = "PROCESSING";
  else if (["created", "queued"].includes(statusResponse.status)) newStatus = "PENDING";
  else if (statusResponse.status === "failed" || statusResponse.status === "error") newStatus = "FAILED";

  await prisma.videoRender.update({
    where: { id: videoRenderId },
    data: { status: newStatus },
  });

  if (statusResponse.download) {
    return ok({
      downloadUrl: statusResponse.download,
      status: statusResponse.status,
    });
  }

  return notFound(`Video download URL not available yet (status: ${statusResponse.status})`);
}

async function handleDeleteVideo(videoRenderId: string): Promise<APIGatewayProxyResult> {
  const video = await prisma.videoRender.update({
    where: { id: videoRenderId },
    data: { isDeleted: true },
  });
  return ok(video);
}
