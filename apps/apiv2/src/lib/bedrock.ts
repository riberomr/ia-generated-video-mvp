import {
  BedrockRuntimeClient,
  InvokeModelCommand,
} from "@aws-sdk/client-bedrock-runtime";

const client = new BedrockRuntimeClient({
  region: process.env.AWS_REGION || "us-east-2",
});

export async function checkCompletion(config: {
  messages: any[];
  model?: string;
  jsonMode?: boolean;
}): Promise<any> {
  const {
    messages,
    model = "us.anthropic.claude-3-5-sonnet-20240620-v1:0",
    jsonMode = false,
  } = config;

  console.log(`Calling Bedrock with model: ${model}`);

  try {
    // Prepare the payload for Claude 3 models
    const payload: any = {
      anthropic_version: "bedrock-2023-05-31",
      max_tokens: 8192,
      messages: messages,
      temperature: 0.7,
    };

    // Extract system prompt if present in messages (because Claude API treats it separately in the payload)
    const systemMessageIndex = messages.findIndex((m) => m.role === "system");
    if (systemMessageIndex !== -1) {
      payload.system = messages[systemMessageIndex].content;
      payload.messages = messages.filter((m) => m.role !== "system");
    }

    const command = new InvokeModelCommand({
      modelId: model,
      contentType: "application/json",
      accept: "application/json",
      body: JSON.stringify(payload),
    });

    const response = await client.send(command);
    const responseBody = JSON.parse(new TextDecoder().decode(response.body));

    // Map Bedrock Claude response to OpenAI-like structure for compatibility
    let content = responseBody.content?.[0]?.text || "";

    // Attempt to strip markdown code blocks if present (common with Claude)
    const jsonMatch =
      content.match(/```json\n([\s\S]*?)\n```/) ||
      content.match(/```\n([\s\S]*?)\n```/);
    if (jsonMatch) {
      content = jsonMatch[1];
    } else {
      // Fallback: if it starts with text like "Here is the JSON:" try to find the first '{' and last '}'
      const firstBrace = content.indexOf("{");
      const lastBrace = content.lastIndexOf("}");
      if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        content = content.substring(firstBrace, lastBrace + 1);
      }
    }

    return {
      choices: [
        {
          message: {
            content: content,
          },
        },
      ],
    };
  } catch (error) {
    console.error("Bedrock API error", error);
    throw new Error("Failed to complete request with Bedrock");
  }
}
