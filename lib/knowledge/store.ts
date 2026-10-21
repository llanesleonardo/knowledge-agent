import { neon } from "@neondatabase/serverless";
import { Pool } from "pg";
let pool: Pool | undefined;
async function query(text: string, values: string[]) {
  if (secret("DATABASE_DRIVER") === "neon") {
    const sql = neon(secret("DATABASE_URL"));
    return await sql.query(text, values);
  }
  pool ??= new Pool({
    connectionString: secret("DATABASE_URL"),
    max: 5,
    connectionTimeoutMillis: 10000,
  });
  return (await pool.query(text, values)).rows;
}
import { binding, secret } from "./platform";
import { defaultAgents, defaultSettings, sampleDocuments } from "./seeds";
import type {
  Workspace,
  Agent,
  KnowledgeDocument,
  Conversation,
  Settings,
} from "./types";
export async function putRecord(kind: string, id: string, data: unknown) {
  const value = JSON.stringify(data);
  if (secret("DATABASE_URL")) {
    await query(
      "INSERT INTO knowledge_records (id,kind,data) VALUES ($1,$2,$3) ON CONFLICT (id) DO UPDATE SET kind=EXCLUDED.kind,data=EXCLUDED.data",
      [id, kind, value],
    );
    return;
  }
  const db = binding("DB");
  if (!db)
    throw new Error(
      "Database is not configured. Configure DATABASE_URL or the hosted database binding.",
    );
  await db
    .prepare(
      "INSERT INTO knowledge_records (id,kind,data) VALUES (?,?,?) ON CONFLICT(id) DO UPDATE SET kind=excluded.kind,data=excluded.data",
    )
    .bind(id, kind, value)
    .run();
}
export async function removeRecord(id: string) {
  if (secret("DATABASE_URL")) {
    await query("DELETE FROM knowledge_records WHERE id=$1", [id]);
  } else
    await binding("DB")
      .prepare("DELETE FROM knowledge_records WHERE id=?")
      .bind(id)
      .run();
}
export async function listRecords<T>(kind: string): Promise<T[]> {
  if (secret("DATABASE_URL")) {
    const rows = await query(
      "SELECT data FROM knowledge_records WHERE kind=$1",
      [kind],
    );
    return rows.map((r) =>
      typeof r.data === "string" ? JSON.parse(r.data) : r.data,
    );
  }
  const db = binding("DB");
  if (!db) throw new Error("Database is not configured.");
  const { results } = await db
    .prepare("SELECT data FROM knowledge_records WHERE kind=?")
    .bind(kind)
    .all();
  return results.map((r: any) => JSON.parse(r.data));
}
export async function workspace(): Promise<Workspace> {
  const [agents, documents, conversations, settings, init] = await Promise.all([
    listRecords<Agent>("agent"),
    listRecords<KnowledgeDocument>("document"),
    listRecords<Conversation>("conversation"),
    listRecords<Settings>("settings"),
    listRecords("initialized"),
  ]);
  if (!init.length) {
    for (const a of defaultAgents) await putRecord("agent", a.id, a);
    for (const d of sampleDocuments()) await putRecord("document", d.id, d);
    await putRecord("initialized", "seeded", { done: true });
  }
  return {
    agents: agents.length ? agents : defaultAgents,
    documents: init.length ? documents : sampleDocuments(),
    conversations: conversations.sort((a, b) =>
      b.updatedAt.localeCompare(a.updatedAt),
    ),
    settings: settings[0] ?? defaultSettings,
  };
}
