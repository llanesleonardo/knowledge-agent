import { ChatOpenAI, OpenAIEmbeddings } from "@langchain/openai";
import { secret } from "./platform";
import type { Settings } from "./types";
export function chatModel(s: Settings) {
  if (s.provider === "demo") throw new Error("Choose a model provider first.");
  if (s.localOnly && s.provider !== "local")
    throw new Error("Local-only routing blocks cloud model calls.");
  const key =
    s.provider === "openai"
      ? secret("OPENAI_API_KEY")
      : s.provider === "openrouter"
        ? secret("OPENROUTER_API_KEY")
        : secret("LOCAL_LLM_API_KEY") || "local";
  const baseURL =
    s.provider === "openrouter"
      ? "https://openrouter.ai/api/v1"
      : s.provider === "local"
        ? secret("LOCAL_LLM_BASE_URL")
        : undefined;
  if (!key || !s.model.trim() || (s.provider === "local" && !baseURL))
    throw new Error(
      "The selected provider is not configured. Check Connections and server environment variables.",
    );
  return new ChatOpenAI({
    model: s.model,
    apiKey: key,
    configuration: { baseURL },
    temperature: s.temperature,
    maxTokens: 1600,
    timeout: 45000,
    maxRetries: 1,
  });
}
export function embeddings(localOnly = false) {
  const baseURL = secret("EMBEDDING_BASE_URL");
  if (!baseURL || !secret("EMBEDDING_MODEL"))
    throw new Error(
      "Configure EMBEDDING_BASE_URL and EMBEDDING_MODEL before enabling vector search.",
    );
  if (localOnly && secret("EMBEDDING_IS_LOCAL") !== "true")
    throw new Error("Local-only routing requires EMBEDDING_IS_LOCAL=true.");
  return new OpenAIEmbeddings({
    model: secret("EMBEDDING_MODEL"),
    apiKey: secret("EMBEDDING_API_KEY") || "local",
    configuration: { baseURL },
    timeout: 45000,
    maxRetries: 1,
  });
}
export async function extractImage(
  bytes: Uint8Array,
  type: string,
  s: Settings,
) {
  if (s.provider === "demo")
    throw new Error(
      "Image ingestion needs a configured vision-capable model. Use text or Markdown in demo mode.",
    );
  let binary = "";
  for (let i = 0; i < bytes.length; i += 8192)
    binary += String.fromCharCode(...bytes.slice(i, i + 8192));
  const model = chatModel({ ...s, model: secret("VISION_MODEL") || s.model });
  const response = await model.invoke([
    {
      role: "user",
      content: [
        {
          type: "text",
          text: "Transcribe this image faithfully into Markdown. Preserve formulas, subscripts, units, labels and tables. Mark unreadable content as [unclear]. Do not infer missing values. Output transcription only.",
        },
        {
          type: "image_url",
          image_url: { url: `data:${type};base64,${btoa(binary)}` },
        },
      ],
    },
  ]);
  return typeof response.content === "string"
    ? response.content
    : JSON.stringify(response.content);
}
