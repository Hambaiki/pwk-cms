import { type NextRequest } from "next/server";
import { eq, and, desc, count, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { entries, collections, entryTags, tags } from "@/lib/db/schema";
import { withPublicKey } from "@/lib/api/middleware";
import {
  ok,
  paginated,
  notFound,
  forbidden,
  parsePagination,
} from "@/lib/api/response";
import type { ApiContext } from "@/lib/api/middleware";

export const GET = withPublicKey(
  async (req: NextRequest, ctx: ApiContext, params) => {
    const { collection: collectionSlug } = params;
    const { searchParams } = req.nextUrl;
    const { page, limit, offset } = parsePagination(searchParams);
    const tagFilter = searchParams.get("tag");

    // In multi-tenant mode a slug is only unique per owner.
    // If a public API key is provided, scope to that key's collection directly.
    // If no key (anonymous), resolve by slug — only returns if exactly one
    // collection with that slug exists (ambiguous slugs are not served anonymously).
    let collectionId: string;

    if (ctx.collectionId) {
      // Key provided — verify the slug matches the key's collection
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
      // Anonymous — find the collection by slug (must be unambiguous)
      const matches = await db
        .select({ id: collections.id })
        .from(collections)
        .where(eq(collections.slug, collectionSlug));

      if (matches.length === 0)
        return notFound(`Collection "${collectionSlug}" not found`);
      if (matches.length > 1) {
        // Multiple owners have this slug — require a key to disambiguate
        return forbidden(
          "This collection slug is ambiguous. Provide an API key to identify the collection.",
        );
      }
      collectionId = matches[0].id;
    }

    const baseWhere = and(
      eq(entries.collectionId, collectionId),
      eq(entries.status, "published"),
    );

    // Optional tag filter — scoped to this collection
    let rows;
    if (tagFilter) {
      const [tag] = await db
        .select({ id: tags.id })
        .from(tags)
        .where(
          and(eq(tags.collectionId, collectionId), eq(tags.slug, tagFilter)),
        )
        .limit(1);

      if (!tag)
        return ok({ data: [], meta: { page, limit, total: 0, totalPages: 0 } });

      rows = await db
        .select({
          id: entries.id,
          slug: entries.slug,
          content: entries.content,
          contentHtml: entries.contentHtml,
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
          contentHtml: entries.contentHtml,
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

    const [{ total }] = await db
      .select({ total: count() })
      .from(entries)
      .where(baseWhere);

    // Attach tags
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

    const shaped = rows.map((e) => ({
      id: e.id,
      slug: e.slug,
      content: e.content,
      contentHtml: e.contentHtml,
      tags: tagsByEntry[e.id] ?? [],
      publishedAt: e.publishedAt,
      updatedAt: e.updatedAt,
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
