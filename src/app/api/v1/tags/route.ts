import { type NextRequest } from "next/server";
import { asc } from "drizzle-orm";
import { db } from "@/lib/db";
import { tags } from "@/lib/db/schema";
import { withPublicKey } from "@/lib/api/middleware";
import { ok } from "@/lib/api/response";
import type { ApiContext } from "@/lib/api/middleware";

export const GET = withPublicKey(
  async (_req: NextRequest, _ctx: ApiContext) => {
    const rows = await db
      .select({ name: tags.name, slug: tags.slug })
      .from(tags)
      .orderBy(asc(tags.name));

    return ok(rows);
  },
);

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization, X-API-Key",
    },
  });
}
