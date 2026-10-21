import { putRecord, workspace } from "@/lib/knowledge/store";
import { fail, safeJson } from "@/lib/knowledge/http";
import { z } from "zod";
const schema = z.object({
  id: z.string().max(80),
  name: z.string().min(1).max(80),
  description: z.string().max(300),
  topic: z.string().min(1).max(100),
  instructions: z.string().min(1).max(5000),
  color: z.string().max(30),
  icon: z.string().max(30),
  enabled: z.boolean(),
});
export async function PUT(r: Request) {
  try {
    const agent = schema.parse(await safeJson(r));
    await putRecord("agent", agent.id, agent);
    return Response.json(agent);
  } catch (e) {
    return fail(e);
  }
}
