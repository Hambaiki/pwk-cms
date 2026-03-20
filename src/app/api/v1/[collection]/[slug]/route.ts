import { type NextRequest } from "next/server";
import { eq, and } from "drizzle-orm";
import { db } from "@/lib/db";
import { entries, collections, entryTags, tags } from "@/lib/db/schema";
import { withPublicKey } from "@/lib/api/middleware";
import { ok, notFound, forbidden } from "@/lib/api/response";
import type { ApiContext } from "@/lib/api/middleware";

export const GET = withPublicKey(
  async (_req: NextRequest, ctx: ApiContext, params) => {
    const { collection: collectionSlug, slug: entrySlug } = params;

    // Resolve collection — same scoping logic as the list route
    let collectionId: string;

    if (ctx.collectionId) {
      const [col] = await db
        .select({ id: collections.id, slug: collections.slug })
        .from(collections)
        .where(eq(collections.id, ctx.collectionId))
        .limit(1);

      if (!col) return notFound("Collection not found");
      if (col.slug !== collectionSlug) {
        return forbidden("This API key is not authorised for this collection");
      }
      collectionId = col.id;
    } else {
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

    const [entry] = await db
      .select({
        id: entries.id,
        slug: entries.slug,
        content: entries.content,
        publishedAt: entries.publishedAt,
        createdAt: entries.createdAt,
        updatedAt: entries.updatedAt,
      })
      .from(entries)
      .where(
        and(
          eq(entries.collectionId, collectionId),
          eq(entries.slug, entrySlug),
          eq(entries.status, "published"),
        ),
      )
      .limit(1);

    if (!entry) return notFound(`Entry "${entrySlug}" not found`);

    const entryTagRows = await db
      .select({ name: tags.name, slug: tags.slug })
      .from(entryTags)
      .innerJoin(tags, eq(entryTags.tagId, tags.id))
      .where(eq(entryTags.entryId, entry.id));

    return ok({
      id: entry.id,
      slug: entry.slug,
      content: entry.content,
      tags: entryTagRows,
      publishedAt: entry.publishedAt,
      updatedAt: entry.updatedAt,
    });
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
