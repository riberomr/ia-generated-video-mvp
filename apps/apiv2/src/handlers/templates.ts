import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import * as synthesia from "../lib/synthesia";
import { ok, notFound, badRequest, serverError } from "../lib/response";

// ── Router ──────────────────────────────────────────────────────────────────
export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  const method = event.httpMethod;
  const id = event.pathParameters?.id;

  try {
    // GET /templates
    if (method === "GET" && !id) {
      return handleListTemplates(event);
    }

    // GET /templates/:id
    if (method === "GET" && id) {
      return handleGetTemplate(id);
    }

    return badRequest("Route not matched");
  } catch (error: any) {
    console.error("templates handler error:", error);
    return serverError(error.message || "Internal server error");
  }
}

// ── Handlers ────────────────────────────────────────────────────────────────

async function handleListTemplates(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  const source = event.queryStringParameters?.source;
  const templates = await synthesia.listTemplates(source);
  return ok(templates);
}

async function handleGetTemplate(id: string): Promise<APIGatewayProxyResult> {
  const template = await synthesia.getTemplate(id);
  if (!template) return notFound("Template not found");
  return ok(template);
}
