import OpenAI from "openai";

let client: OpenAI;

function getClient(): OpenAI {
  if (!client) {
    client = new OpenAI({
      apiKey: process.env.GROQ_API_KEY,
      baseURL: "https://api.groq.com/openai/v1",
    });
  }
  return client;
}

export async function checkCompletion(config: {
  messages: Array<{ role: string; content: string }>;
  model?: string;
  jsonMode?: boolean;
}): Promise<any> {
  const {
    messages,
    model = "llama-3.3-70b-versatile",
    jsonMode = false,
  } = config;

  const completion = await getClient().chat.completions.create({
    messages: messages as any,
    model,
    response_format: jsonMode ? { type: "json_object" } : undefined,
  });

  return completion;
}
