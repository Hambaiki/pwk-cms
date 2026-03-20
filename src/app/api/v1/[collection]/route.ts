import { type NextRequest } from "next/server";
import { eq, and, desc, count, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { entries, collections, entryTags, tags } from "@/lib/db/schema";
import { withPublicKey } from "@/lib/api/middleware";
import {
  ok,
  paginated,
  notFound,
  badRequest,
  parsePagination,
} from "@/lib/api/response";
import type { ApiContext } from "@/lib/api/middleware";

export const GET = withPublicKey(
  async (req: NextRequest, _ctx: ApiContext, params) => {
    const { collection: collectionSlug } = params;
    const { searchParams } = req.nextUrl;
    const { page, limit, offset } = parsePagination(searchParams);

    const tagFilter = searchParams.get("tag");

    // Resolve collection
    const [collection] = await db
      .select({
        id: collections.id,
        name: collections.name,
        slug: collections.slug,
      })
      .from(collections)
      .where(eq(collections.slug, collectionSlug))
      .limit(1);

    if (!collection)
      return notFound(`Collection "${collectionSlug}" not found`);

    // Base condition — always published only on public routes
    const baseWhere = and(
      eq(entries.collectionId, collection.id),
      eq(entries.status, "published"),
    );

    // Optional tag filter
    let rows;
    if (tagFilter) {
      const [tag] = await db
        .select({ id: tags.id })
        .from(tags)
        .where(eq(tags.slug, tagFilter))
        .limit(1);

      if (!tag) return ok([], 200); // tag not found = empty result

      rows = await db
        .select({
          id: entries.id,
          slug: entries.slug,
          content: entries.content,
          publishedAt: entries.publishedAt,
          createdAt: entries.createdAt,
          updatedAt: entries.updatedAt,
        })
        .from(entries)
        .innerJoin(
          entryTags,
          and(eq(entryTags.entryId, entries.id), eq(entryTags.tagId, tag.id)),
        )
        .where(baseWhere)
        .orderBy(desc(entries.publishedAt))
        .limit(limit)
        .offset(offset);
    } else {
      rows = await db
        .select({
          id: entries.id,
          slug: entries.slug,
          content: entries.content,
          publishedAt: entries.publishedAt,
          createdAt: entries.createdAt,
          updatedAt: entries.updatedAt,
        })
        .from(entries)
        .where(baseWhere)
        .orderBy(desc(entries.publishedAt))
        .limit(limit)
        .offset(offset);
    }

    // Total count for pagination meta
    const [{ total }] = await db
      .select({ total: count() })
      .from(entries)
      .where(baseWhere);

    // Attach tags to each entry
    const entryIds = rows.map((r) => r.id);
    const tagRows =
      entryIds.length > 0
        ? await db
            .select({
              entryId: entryTags.entryId,
              tagName: tags.name,
              tagSlug: tags.slug,
            })
            .from(entryTags)
            .innerJoin(tags, eq(entryTags.tagId, tags.id))
            .where(inArray(entryTags.entryId, entryIds))
        : [];

    const tagsByEntry = tagRows.reduce<
      Record<string, { name: string; slug: string }[]>
    >((acc, t) => {
      if (!acc[t.entryId]) acc[t.entryId] = [];
      acc[t.entryId].push({ name: t.tagName, slug: t.tagSlug });
      return acc;
    }, {});

    const shaped = rows.map((entry) => ({
      id: entry.id,
      slug: entry.slug,
      content: entry.content,
      tags: tagsByEntry[entry.id] ?? [],
      publishedAt: entry.publishedAt,
      updatedAt: entry.updatedAt,
    }));

    return paginated(shaped, { page, limit, total: Number(total) });
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
