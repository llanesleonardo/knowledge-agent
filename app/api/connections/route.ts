import { secret, binding } from "@/lib/knowledge/platform";
import { putRecord } from "@/lib/knowledge/store";
import { fail, safeJson } from "@/lib/knowledge/http";
import { z } from "zod";
export const dynamic = "force-dynamic";
export async function GET() {
  return Response.json({
    openai: !!secret("OPENAI_API_KEY"),
    openrouter: !!secret("OPENROUTER_API_KEY"),
    local: !!secret("LOCAL_LLM_BASE_URL"),
    embeddings: !!secret("EMBEDDING_BASE_URL") && !!secret("EMBEDDING_MODEL"),
    qdrant: !!secret("QDRANT_URL"),
    database: secret("DATABASE_URL")
      ? "PostgreSQL"
      : binding("LOCAL_RECORDS")
        ? "Local demo records"
        : "Hosted workspace database",
    storage: secret("AZURE_BLOB_CONTAINER_URL")
      ? "Azure Blob storage"
      : binding("BUCKET")
        ? "Blob storage"
        : secret("LOCAL_STORAGE_PATH")
          ? "Local files"
          : "Not configured",
    onnx: false,
    embeddingModel: secret("EMBEDDING_MODEL") || null,
  });
}
const schema = z.object({
  provider: z.enum(["demo", "openai", "openrouter", "local"]),
  model: z.string().max(200),
  temperature: z.number().min(0).max(1),
  citations: z.boolean(),
  retrieval: z.enum(["keyword", "qdrant"]),
  localOnly: z.boolean(),
});
export async function PUT(r: Request) {
  try {
    const settings = schema.parse(await safeJson(r));
    if (
      settings.localOnly &&
      settings.provider !== "local" &&
      settings.provider !== "demo"
    )
      throw new Error("Choose the local provider for local-only routing.");
    await putRecord("settings", "settings", settings);
    return Response.json(settings);
  } catch (e) {
    return fail(e);
  }
}
