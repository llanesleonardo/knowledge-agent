import assert from "node:assert/strict";
const base = process.env.TEST_BASE_URL || "http://127.0.0.1:3000";
const created = [],
  conversations = [];
let checks = 0;
async function request(path, options) {
  const r = await fetch(base + path, options);
  return { r, data: await r.json() };
}
const json = (method, data) => ({
  method,
  headers: { "content-type": "application/json" },
  body: JSON.stringify(data),
});
const check = (condition, message) => {
  assert.ok(condition, message);
  console.log(`PASS ${++checks}: ${message}`);
};
async function chat(question, agentId = "general") {
  const result = await request(
    "/api/chat",
    json("POST", { question, agentId }),
  );
  if (result.r.ok) conversations.push(result.data.conversation.id);
  return result;
}
function pdfFixture() {
  const objs = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R 5 0 R] /Count 2 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 7 0 R >> >> /Contents 4 0 R >>",
    null,
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 7 0 R >> >> /Contents 6 0 R >>",
    null,
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
  ];
  for (const [i, t] of [
    [3, "First page: testing document extraction."],
    [5, "Zirconium verification: reference value is 47 units."],
  ]) {
    const stream = `BT /F1 12 Tf 72 700 Td (${t}) Tj ET`;
    objs[i] = `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`;
  }
  let pdf = "%PDF-1.4\n",
    offsets = [0];
  for (let i = 0; i < objs.length; i++) {
    offsets.push(Buffer.byteLength(pdf));
    pdf += `${i + 1} 0 obj\n${objs[i]}\nendobj\n`;
  }
  const xref = Buffer.byteLength(pdf);
  pdf +=
    `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n` +
    offsets
      .slice(1)
      .map((n) => `${String(n).padStart(10, "0")} 00000 n \n`)
      .join("") +
    `trailer\n<< /Size ${objs.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return pdf;
}
try {
  const { data: w, r } = await request("/api/workspace");
  check(
    r.ok && w.documents.length >= 3,
    "workspace loads with example knowledge",
  );
  const status = (await request("/api/connections")).data;
  check(
    status.database === "Local demo records" &&
      !JSON.stringify(status).includes("API_KEY"),
    "local persistence is active; status does not expose credentials",
  );
  const invalid = await chat("   ");
  check(invalid.r.status === 400, "blank questions are rejected");
  const answer = await chat("What does C-rate mean for a battery?", "battery");
  check(
    answer.r.ok &&
      answer.data.message.citations.length > 0 &&
      answer.data.message.mode === "Source preview",
    "demo retrieval returns grounded source excerpts",
  );
  const f = new FormData();
  f.set("name", "Disposable verification.md");
  f.set(
    "text",
    "Quartzflux calibration reference: the verification threshold is 73 units.",
  );
  f.set("topic", "Verification");
  f.set("status", "draft");
  const added = await request("/api/documents", { method: "POST", body: f });
  check(
    added.r.ok && added.data.document.status === "draft",
    "pasted knowledge is durably ingested as a draft",
  );
  const id = added.data.document.id;
  created.push(id);
  let result = await chat("Quartzflux calibration threshold");
  check(
    result.data.message.citations.length === 0,
    "draft content is excluded from retrieval",
  );
  await request("/api/documents", json("PATCH", { id, status: "ready" }));
  result = await chat("Quartzflux calibration threshold");
  check(
    result.data.message.citations.some((c) => c.documentId === id),
    "published content is retrievable",
  );
  result = await chat("Quartzflux calibration threshold", "guides");
  check(
    result.data.message.citations.every((c) => c.documentId !== id),
    "specialist topic restrictions exclude unrelated documents",
  );
  const downloaded = await fetch(base + `/api/source?id=${id}`);
  check(
    (await downloaded.text()).includes("73 units"),
    "original source can be downloaded",
  );
  const pdf = new FormData();
  pdf.set(
    "file",
    new Blob([pdfFixture()], { type: "application/pdf" }),
    "Disposable verification.pdf",
  );
  pdf.set("topic", "Verification");
  const parsed = await request("/api/documents", { method: "POST", body: pdf });
  if (parsed.r.ok) created.push(parsed.data.document.id);
  check(
    parsed.r.ok &&
      parsed.data.document.chunks.some(
        (c) => c.page === 2 && c.text.includes("Zirconium"),
      ),
    "PDF ingestion preserves page references",
  );
  const persisted = (await request("/api/workspace")).data;
  check(
    persisted.documents.some((d) => d.id === id) &&
      persisted.conversations.length >= 2,
    "documents and conversation history persist across requests",
  );
  const blocked = await request(
    "/api/connections",
    json("PUT", { ...w.settings, provider: "openai", localOnly: true }),
  );
  check(blocked.r.status === 400, "local-only policy rejects a cloud provider");
  console.log(`\n${checks} checks passed.`);
} finally {
  for (const id of created)
    await fetch(base + `/api/documents?id=${id}`, { method: "DELETE" });
  for (const id of conversations)
    await fetch(base + `/api/chat?id=${id}`, { method: "DELETE" });
}
