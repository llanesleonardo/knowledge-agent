import { workspace } from "@/lib/knowledge/store";
import { fail } from "@/lib/knowledge/http";
export const dynamic = "force-dynamic";
export async function GET() {
  try {
    return Response.json(await workspace(), {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (e) {
    return fail(e, 500);
  }
}
