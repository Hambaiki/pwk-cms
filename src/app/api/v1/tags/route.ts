import { type NextRequest } from "next/server";
import { eq, asc } from "drizzle-orm";
import { db } from "@/lib/db";
import { tags, collections } from "@/lib/db/schema";
import { withPublicKey } from "@/lib/api/middleware";
import { ok, notFound, badRequest, forbidden } from "@/lib/api/response";
import type { ApiContext } from "@/lib/api/middleware";

// GET /api/v1/tags?collection=<slug>
// Returns tags for a specific collection.
// Requires either a public API key (scoped to the collection)
// or a ?collection=<slug> query param for unambiguous slugs.

export const GET = withPublicKey(async (req: NextRequest, ctx: ApiContext) => {
  const collectionSlug = req.nextUrl.searchParams.get("collection");

  let collectionId: string;

  if (ctx.collectionId) {
    // Key provided — use its collection directly, optionally verify slug matches
    if (collectionSlug) {
      const [col] = await db
        .select({ id: collections.id, slug: collections.slug })
        .from(collections)
        .where(eq(collections.id, ctx.collectionId))
        .limit(1);
      if (!col) return notFound("Collection not found");
      if (col.slug !== collectionSlug) {
        return forbidden("This API key is not authorised for this collection");
      }
    }
    collectionId = ctx.collectionId;
  } else {
    if (!collectionSlug) {
      return badRequest(
        "Provide a ?collection=<slug> param or an API key scoped to a collection",
      );
    }
    const matches = await db
      .select({ id: collections.id })
      .from(collections)
      .where(eq(collections.slug, collectionSlug));

    if (matches.length === 0)
      return notFound(`Collection "${collectionSlug}" not found`);
    if (matches.length > 1) {
      return forbidden(
        "This collection slug is ambiguous. Provide an API key to identify the collection.",
      );
    }
    collectionId = matches[0].id;
  }

  const rows = await db
    .select({ name: tags.name, slug: tags.slug })
    .from(tags)
    .where(eq(tags.collectionId, collectionId))
    .orderBy(asc(tags.name));

  return ok(rows);
});

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
