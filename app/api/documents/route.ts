import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { extractText, getDocumentProxy } from "unpdf";
import { workspace, putRecord, removeRecord } from "@/lib/knowledge/store";
import { storeFile, deleteFile } from "@/lib/knowledge/storage";
import { extractImage } from "@/lib/knowledge/gateway";
import { indexDocument, removeVectors } from "@/lib/knowledge/retrieval";
import { fail } from "@/lib/knowledge/http";
import { secret } from "@/lib/knowledge/platform";
import type { KnowledgeDocument, Chunk } from "@/lib/knowledge/types";
export async function POST(r: Request) {
  try {
    if (Number(r.headers.get("content-length") || 0) > 6 * 1024 * 1024)
      throw new Error("Maximum upload size is 5 MB.");
    const form = await r.formData();
    const file = form.get("file");
    const pasted = String(form.get("text") || "");
    const topic = String(form.get("topic") || "General").slice(0, 100);
    const status = form.get("status") === "draft" ? "draft" : "ready";
    const id = crypto.randomUUID();
    const w = await workspace();
    let name = String(form.get("name") || "Untitled note.md").slice(0, 180),
      type = "md",
      key: string | undefined,
      size = 0;
    let pages: string[] = [];
    let bytes: Uint8Array | undefined;
    if (file instanceof File) {
      if (file.size > 5 * 1024 * 1024)
        throw new Error("Maximum upload size is 5 MB.");
      name = file.name.slice(0, 180);
      type = name.split(".").pop()?.toLowerCase() || "txt";
      bytes = new Uint8Array(await file.arrayBuffer());
      size = bytes.length;
      if (type === "pdf") {
        const pdf = await getDocumentProxy(bytes.slice());
        try {
          const extracted = await extractText(pdf, { mergePages: false });
          pages = extracted.text;
        } finally {
          await (pdf as any).destroy?.();
        }
        if (!pages.join("").trim())
          throw new Error(
            "This PDF has no extractable text. OCR for scanned PDFs is not configured.",
          );
      } else if (["txt", "md", "markdown", "csv"].includes(type))
        pages = [new TextDecoder().decode(bytes)];
      else if (["png", "jpg", "jpeg", "webp"].includes(type)) {
        pages = [
          await extractImage(bytes, file.type || `image/${type}`, w.settings),
        ];
      } else
        throw new Error(
          "Supported formats: PDF, MD, TXT, CSV, PNG, JPG, WEBP.",
        );
    } else {
      if (!pasted.trim()) throw new Error("Upload a file or paste some text.");
      pages = [pasted];
      bytes = new TextEncoder().encode(pasted);
      size = bytes.length;
      if (size > 1000000) throw new Error("Pasted text exceeds 1 MB.");
    }
    if (pages.join("").length > 250000)
      throw new Error(
        "This document exceeds the initial version’s 250,000-character limit. Split it into smaller documents.",
      );
    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1400,
      chunkOverlap: 180,
    });
    const chunks: Chunk[] = [];
    for (let i = 0; i < pages.length; i++) {
      for (const text of await splitter.splitText(pages[i]))
        if (text.trim())
          chunks.push({
            id: crypto.randomUUID(),
            text,
            page: i + 1,
            documentId: id,
          });
    }
    if (!chunks.length) throw new Error("No searchable text found.");
    key = id;
    await storeFile(
      key,
      bytes!,
      file instanceof File ? file.type : "text/markdown",
    );
    const doc: KnowledgeDocument = {
      id,
      name,
      type,
      topic,
      status,
      createdAt: new Date().toISOString(),
      size,
      chunks,
      key,
    };
    // Store the document before optional indexing so a vector-service error cannot lose the upload.
    await putRecord("document", id, doc);
    let warning: string | undefined;
    if (w.settings.retrieval === "qdrant") {
      try {
        await indexDocument(doc, w.settings.localOnly);
        doc.indexed = true;
        doc.embeddingModel = secret("EMBEDDING_MODEL");
        await putRecord("document", id, doc);
      } catch (e) {
        warning = `Saved, but vector indexing failed: ${e instanceof Error ? e.message : "Unknown error"}. Retry indexing from the library.`;
      }
    }
    return Response.json({ document: doc, warning });
  } catch (e) {
    return fail(e);
  }
}
export async function PATCH(r: Request) {
  try {
    const { id, status, reindex } = (await r.json()) as {
      id: string;
      status: "ready" | "draft";
      reindex?: boolean;
    };
    const w = await workspace();
    const doc = w.documents.find((d) => d.id === id);
    if (!doc) throw new Error("Document not found.");
    if (reindex) {
      await removeVectors(doc.id);
      await indexDocument(doc, w.settings.localOnly);
      doc.indexed = true;
      doc.embeddingModel = secret("EMBEDDING_MODEL");
    } else {
      if (!["ready", "draft"].includes(status))
        throw new Error("Invalid status.");
      doc.status = status;
    }
    await putRecord("document", doc.id, doc);
    return Response.json(doc);
  } catch (e) {
    return fail(e);
  }
}
export async function DELETE(r: Request) {
  try {
    const id = new URL(r.url).searchParams.get("id");
    const w = await workspace();
    const doc = w.documents.find((d) => d.id === id);
    if (!doc) throw new Error("Document not found.");
    if (doc.indexed) await removeVectors(doc.id);
    if (doc.key) await deleteFile(doc.key);
    await removeRecord(doc.id);
    return Response.json({ ok: true });
  } catch (e) {
    return fail(e);
  }
}
