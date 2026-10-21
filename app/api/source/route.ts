import { workspace } from "@/lib/knowledge/store";
import { readFile } from "@/lib/knowledge/storage";
import { fail } from "@/lib/knowledge/http";
export async function GET(r: Request) {
  try {
    const id = new URL(r.url).searchParams.get("id");
    const doc = (await workspace()).documents.find((d) => d.id === id);
    if (!doc)
      return Response.json({ error: "Document not found" }, { status: 404 });
    if (doc.key) {
      const f = await readFile(doc.key);
      if (f)
        return new Response(f.bytes as BodyInit, {
          headers: {
            "Content-Type": f.type,
            "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(doc.name)}`,
            "X-Content-Type-Options": "nosniff",
          },
        });
    }
    return new Response(doc.chunks.map((c) => c.text).join("\n\n"), {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  } catch (e) {
    return fail(e);
  }
}
