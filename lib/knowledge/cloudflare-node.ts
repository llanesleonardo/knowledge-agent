// Native Next.js adapter: durable local demo records; DATABASE_URL selects PostgreSQL.
import { readFile, writeFile, mkdir, rename } from "node:fs/promises";
import path from "node:path";
const root = path.resolve(process.env.LOCAL_DATA_PATH || "./data");
const filename = path.join(root, "workspace.json");
let pending: Promise<unknown> = Promise.resolve();
async function readRecords(): Promise<
  Record<string, { kind: string; data: string }>
> {
  try {
    return JSON.parse(await readFile(filename, "utf8"));
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code === "ENOENT") return {};
    throw e;
  }
}
function mutation(
  fn: (records: Record<string, { kind: string; data: string }>) => void,
) {
  const operation = pending.then(async () => {
    await mkdir(root, { recursive: true });
    const records = await readRecords();
    fn(records);
    const temporary = `${filename}.tmp`;
    await writeFile(temporary, JSON.stringify(records));
    await rename(temporary, filename);
  });
  pending = operation.catch(() => {});
  return operation;
}
const DB = {
  prepare(sql: string) {
    let args: string[] = [];
    return {
      bind(...values: string[]) {
        args = values;
        return this;
      },
      async all() {
        await pending;
        const records = await readRecords();
        return {
          results: Object.values(records)
            .filter((r) => r.kind === args[0])
            .map((r) => ({ data: r.data })),
        };
      },
      async run() {
        if (sql.startsWith("INSERT"))
          await mutation((records) => {
            records[args[0]] = { kind: args[1], data: args[2] };
          });
        else if (sql.startsWith("DELETE"))
          await mutation((records) => {
            delete records[args[0]];
          });
        else throw new Error("Unsupported local record operation.");
        return { success: true };
      },
    };
  },
};
export const env: Record<string, unknown> = {
  DB,
  LOCAL_STORAGE_PATH:
    process.env.LOCAL_STORAGE_PATH || path.join(root, "uploads"),
  LOCAL_RECORDS: "true",
};
