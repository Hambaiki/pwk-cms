import { type NextRequest } from "next/server";
import { eq, and } from "drizzle-orm";
import { db } from "@/lib/db";
import { entries, collections, entryTags, tags } from "@/lib/db/schema";
import { withPublicKey } from "@/lib/api/middleware";
import { ok, notFound } from "@/lib/api/response";
import type { ApiContext } from "@/lib/api/middleware";

export const GET = withPublicKey(
  async (_req: NextRequest, _ctx: ApiContext, params) => {
    const { collection: collectionSlug, slug: entrySlug } = params;

    // Resolve collection
    const [collection] = await db
      .select({ id: collections.id })
      .from(collections)
      .where(eq(collections.slug, collectionSlug))
      .limit(1);

    if (!collection)
      return notFound(`Collection "${collectionSlug}" not found`);

    // Fetch the entry — published only
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
          eq(entries.collectionId, collection.id),
          eq(entries.slug, entrySlug),
          eq(entries.status, "published"),
        ),
      )
      .limit(1);

    if (!entry) return notFound(`Entry "${entrySlug}" not found`);

    // Fetch tags for this entry
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
