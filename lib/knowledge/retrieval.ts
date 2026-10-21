import { secret } from "./platform";
import { embeddings } from "./gateway";
import type { KnowledgeDocument, Agent, Citation, Settings } from "./types";
const stop = new Set(
  "what is are the a an how does do to of in and for my can you it this that with about tell me explain please".split(
    " ",
  ),
);
export function terms(text: string) {
  return (
    text
      .toLowerCase()
      .match(/[\p{L}\p{N}]+/gu)
      ?.filter((t) => !stop.has(t)) ?? []
  );
}
export function keywordSearch(
  question: string,
  documents: KnowledgeDocument[],
): Citation[] {
  const words = [...new Set(terms(question))];
  if (!words.length) return [];
  return documents
    .flatMap((d) =>
      d.chunks.map((c) => {
        const text = c.text.toLowerCase();
        const score =
          words.reduce((n, w) => n + (text.includes(w) ? 1 : 0), 0) /
          words.length;
        return {
          documentId: d.id,
          name: d.name,
          page: c.page,
          text: c.text,
          score,
        };
      }),
    )
    .filter((c) => (c.score ?? 0) >= Math.min(0.5, 1 / words.length))
    .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
    .slice(0, 4);
}
async function qdrant(path: string, method: string, body?: unknown) {
  const url = secret("QDRANT_URL");
  if (!url) throw new Error("Qdrant URL is not configured.");
  const r = await fetch(url.replace(/\/$/, "") + path, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(secret("QDRANT_API_KEY")
        ? { "api-key": secret("QDRANT_API_KEY") }
        : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(45000),
  });
  if (!r.ok)
    throw new Error(
      `Qdrant request failed (${r.status}). Check collection and connection settings.`,
    );
  return r.json() as Promise<any>;
}
function collection() {
  return encodeURIComponent(secret("QDRANT_COLLECTION") || "knowledge");
}
export async function indexDocument(doc: KnowledgeDocument, localOnly = false) {
  const vectors = await embeddings(localOnly).embedDocuments(
    doc.chunks.map((c) => c.text),
  );
  if (!vectors.length) throw new Error("No embeddings generated.");
  const info = await fetch(
    `${secret("QDRANT_URL").replace(/\/$/, "")}/collections/${collection()}`,
    {
      headers: secret("QDRANT_API_KEY")
        ? { "api-key": secret("QDRANT_API_KEY") }
        : {},
      signal: AbortSignal.timeout(15000),
    },
  );
  if (info.status === 404)
    await qdrant(`/collections/${collection()}`, "PUT", {
      vectors: { size: vectors[0].length, distance: "Cosine" },
    });
  else if (!info.ok) throw new Error("Cannot access Qdrant collection.");
  else {
    const config = (await info.json()) as any;
    if (config.result?.config?.params?.vectors?.size !== vectors[0].length)
      throw new Error(
        "Embedding dimension differs from this collection. Use a new collection and reindex.",
      );
  }
  await qdrant(`/collections/${collection()}/points?wait=true`, "PUT", {
    points: doc.chunks.map((c, i) => ({
      id: crypto.randomUUID(),
      vector: vectors[i],
      payload: {
        documentId: doc.id,
        chunkId: c.id,
        embeddingModel: secret("EMBEDDING_MODEL"),
      },
    })),
  });
}
export async function removeVectors(documentId: string) {
  if (secret("QDRANT_URL"))
    await qdrant(
      `/collections/${collection()}/points/delete?wait=true`,
      "POST",
      {
        filter: { must: [{ key: "documentId", match: { value: documentId } }] },
      },
    );
}
export async function retrieve(
  question: string,
  docs: KnowledgeDocument[],
  agent: Agent,
  s: Settings,
) {
  const allowed = docs.filter(
    (d) =>
      d.status === "ready" &&
      (agent.topic === "all" || d.topic === agent.topic),
  );
  if (s.retrieval === "keyword") return keywordSearch(question, allowed);
  const indexed = allowed.filter((d) => d.indexed);
  if (!indexed.length) return [];
  if (indexed.some((d) => d.embeddingModel !== secret("EMBEDDING_MODEL")))
    throw new Error(
      "Embedding model changed. Reindex your documents before searching.",
    );
  const vector = await embeddings(s.localOnly).embedQuery(question);
  const response = await qdrant(
    `/collections/${collection()}/points/query`,
    "POST",
    {
      query: vector,
      limit: 8,
      with_payload: true,
      filter: {
        must: [{ key: "documentId", match: { any: indexed.map((d) => d.id) } }],
      },
    },
  );
  const found: Citation[] = [];
  for (const p of response.result?.points ?? []) {
    const doc = indexed.find((d) => d.id === p.payload?.documentId);
    const chunk = doc?.chunks.find((c) => c.id === p.payload?.chunkId);
    if (doc && chunk && p.score >= 0.25)
      found.push({
        documentId: doc.id,
        name: doc.name,
        page: chunk.page,
        text: chunk.text,
        score: p.score,
      });
  }
  return found.slice(0, 4);
}
