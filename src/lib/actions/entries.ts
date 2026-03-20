"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { eq, and, asc, desc, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  entries,
  collections,
  fields,
  entryTags,
  tags,
  collectionMembers,
} from "@/lib/db/schema";
import type { Entry, Collection, Field, Tag } from "@/lib/db/schema";
import { verifySession } from "@/lib/dal";
import { requireCollectionRole } from "@/lib/actions/collections";

function slugify(v: string) {
  return v
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export type EntryDetail = {
  entry: Entry;
  collection: Collection;
  fields: Field[];
};

export type EntryFormErrors = { general?: string[]; slug?: string[] };
export type EntryFormState =
  | { errors?: EntryFormErrors; message?: string }
  | undefined;

// ─── Queries ───────────────────────────────────────────────────────────────────

export async function getEntriesByCollection(collectionSlug: string): Promise<{
  collection: Collection;
  entries: (Entry & { tags: Pick<Tag, "id" | "name" | "slug">[] })[];
} | null> {
  const session = await verifySession();

  // Find the collection by slug scoped to collections the current user is a member of.
  // Joining through collection_members ensures we never return a collection the user
  // can't access, and resolves slug ambiguity across different owners.
  let collection: Collection | undefined;
  try {
    const rows = await db
      .select({
        id: collections.id,
        name: collections.name,
        slug: collections.slug,
        description: collections.description,
        icon: collections.icon,
        isPage: collections.isPage,
        ownerId: collections.ownerId,
        createdAt: collections.createdAt,
        updatedAt: collections.updatedAt,
      })
      .from(collections)
      .innerJoin(
        collectionMembers,
        and(
          eq(collectionMembers.collectionId, collections.id),
          eq(collectionMembers.userId, session.userId),
        ),
      )
      .where(eq(collections.slug, collectionSlug))
      .limit(1);
    collection = rows[0] as Collection | undefined;
  } catch (e) {
    console.error("[getEntriesByCollection] query failed:", e);
    return null;
  }

  if (!collection) return null;

  try {
    const rows = await db
      .select()
      .from(entries)
      .where(eq(entries.collectionId, collection.id))
      .orderBy(desc(entries.updatedAt));

    const entryIds = rows.map((r) => r.id);
    const tagRows =
      entryIds.length > 0
        ? await db
            .select({
              entryId: entryTags.entryId,
              id: tags.id,
              name: tags.name,
              slug: tags.slug,
            })
            .from(entryTags)
            .innerJoin(tags, eq(entryTags.tagId, tags.id))
            .where(inArray(entryTags.entryId, entryIds))
        : [];

    const tagsByEntry = tagRows.reduce<
      Record<string, Pick<Tag, "id" | "name" | "slug">[]>
    >((acc, t) => {
      if (!acc[t.entryId]) acc[t.entryId] = [];
      acc[t.entryId].push({ id: t.id, name: t.name, slug: t.slug });
      return acc;
    }, {});

    return {
      collection,
      entries: rows.map((e) => ({ ...e, tags: tagsByEntry[e.id] ?? [] })),
    };
  } catch {
    return { collection, entries: [] };
  }
}

export async function getEntryById(
  entryId: string,
): Promise<EntryDetail | null> {
  const session = await verifySession();

  const [entry] = await db
    .select()
    .from(entries)
    .where(eq(entries.id, entryId))
    .limit(1);

  if (!entry) return null;

  try {
    await requireCollectionRole(entry.collectionId, session.userId, "viewer");
  } catch {
    return null;
  }

  const [collection] = await db
    .select()
    .from(collections)
    .where(eq(collections.id, entry.collectionId))
    .limit(1);

  if (!collection) return null;

  const collectionFields = await db
    .select()
    .from(fields)
    .where(eq(fields.collectionId, collection.id))
    .orderBy(asc(fields.sortOrder));

  return { entry, collection, fields: collectionFields };
}

// ─── Create Entry ───────────────────────────────────────────────────────────────

export async function createEntry(collectionId: string): Promise<void> {
  const session = await verifySession();
  await requireCollectionRole(collectionId, session.userId, "editor");

  const [collection] = await db
    .select()
    .from(collections)
    .where(eq(collections.id, collectionId))
    .limit(1);

  if (!collection) throw new Error("Collection not found");

  const [created] = await db
    .insert(entries)
    .values({
      collectionId,
      slug: `draft-${Date.now()}`,
      status: "draft",
      content: {},
      authorId: session.userId,
    })
    .returning({ id: entries.id });

  if (!created) throw new Error("Failed to create entry");

  revalidatePath(`/cms/entries/${collection.slug}`);
  redirect(`/cms/editor/${created.id}`);
}

// ─── Get or create page entry ──────────────────────────────────────────────────

export async function getOrCreatePageEntry(
  collectionId: string,
): Promise<string> {
  const session = await verifySession();
  await requireCollectionRole(collectionId, session.userId, "viewer");

  const [existing] = await db
    .select({ id: entries.id })
    .from(entries)
    .where(eq(entries.collectionId, collectionId))
    .limit(1);

  if (existing) return existing.id;

  // Need at least editor to create
  await requireCollectionRole(collectionId, session.userId, "editor");

  const [collection] = await db
    .select({ slug: collections.slug })
    .from(collections)
    .where(eq(collections.id, collectionId))
    .limit(1);

  if (!collection) throw new Error("Collection not found");

  const [created] = await db
    .insert(entries)
    .values({
      collectionId,
      slug: collection.slug,
      status: "draft",
      content: {},
      authorId: session.userId,
    })
    .returning({ id: entries.id });

  if (!created) throw new Error("Failed to create page entry");

  return created.id;
}

// ─── Save Entry ────────────────────────────────────────────────────────────────

const SaveSchema = z.object({
  entryId: z.string().uuid(),
  slug: z
    .string()
    .min(1)
    .max(200)
    .regex(/^[a-z0-9-]+$/),
  content: z.string().min(2),
});

export async function saveEntry(
  _state: EntryFormState,
  formData: FormData,
): Promise<EntryFormState> {
  const session = await verifySession();

  const validated = SaveSchema.safeParse({
    entryId: formData.get("entryId"),
    slug: formData.get("slug"),
    content: formData.get("content"),
  });

  if (!validated.success) {
    const e = validated.error.flatten().fieldErrors;
    return {
      errors: { slug: e.slug ?? undefined, general: e.content ?? undefined },
    };
  }

  const { entryId, slug } = validated.data;
  let content: unknown;
  try {
    content = JSON.parse(validated.data.content);
  } catch {
    return { errors: { general: ["Invalid content format."] } };
  }

  const [existing] = await db
    .select()
    .from(entries)
    .where(eq(entries.id, entryId))
    .limit(1);
  if (!existing) return { errors: { general: ["Entry not found."] } };

  // Need at least editor access to the collection
  try {
    await requireCollectionRole(
      existing.collectionId,
      session.userId,
      "editor",
    );
  } catch {
    return {
      errors: { general: ["You do not have permission to edit this entry."] },
    };
  }

  // Slug uniqueness within collection
  const [conflict] = await db
    .select({ id: entries.id })
    .from(entries)
    .where(
      and(
        eq(entries.collectionId, existing.collectionId),
        eq(entries.slug, slug),
      ),
    )
    .limit(1);

  if (conflict && conflict.id !== entryId) {
    return {
      errors: {
        slug: [`The slug "${slug}" is already used in this collection.`],
      },
    };
  }

  await db
    .update(entries)
    .set({
      slug,
      content: content as Record<string, unknown>,
      updatedAt: new Date(),
    })
    .where(eq(entries.id, entryId));

  revalidatePath(`/cms/editor/${entryId}`);
  return { message: "Saved." };
}

// ─── Publish / Unpublish ───────────────────────────────────────────────────────

export async function publishEntry(entryId: string): Promise<void> {
  const session = await verifySession();
  const [entry] = await db
    .select({ collectionId: entries.collectionId })
    .from(entries)
    .where(eq(entries.id, entryId))
    .limit(1);
  if (!entry) return;
  await requireCollectionRole(entry.collectionId, session.userId, "editor");
  await db
    .update(entries)
    .set({
      status: "published",
      publishedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(entries.id, entryId));
  revalidatePath(`/cms/editor/${entryId}`);
}

export async function unpublishEntry(entryId: string): Promise<void> {
  const session = await verifySession();
  const [entry] = await db
    .select({ collectionId: entries.collectionId })
    .from(entries)
    .where(eq(entries.id, entryId))
    .limit(1);
  if (!entry) return;
  await requireCollectionRole(entry.collectionId, session.userId, "editor");
  await db
    .update(entries)
    .set({ status: "draft", publishedAt: null, updatedAt: new Date() })
    .where(eq(entries.id, entryId));
  revalidatePath(`/cms/editor/${entryId}`);
}

// ─── Delete Entry ──────────────────────────────────────────────────────────────

export async function deleteEntry(
  entryId: string,
  collectionSlug: string,
): Promise<void> {
  const session = await verifySession();
  const [entry] = await db
    .select()
    .from(entries)
    .where(eq(entries.id, entryId))
    .limit(1);
  if (!entry) throw new Error("Entry not found");
  // owner can delete any entry; editors can only delete their own
  const role = await requireCollectionRole(
    entry.collectionId,
    session.userId,
    "editor",
  );
  if (role === "editor" && entry.authorId !== session.userId) {
    throw new Error("Editors can only delete their own entries");
  }
  await db.delete(entries).where(eq(entries.id, entryId));
  revalidatePath(`/cms/entries/${collectionSlug}`);
  redirect(`/cms/entries/${collectionSlug}`);
}
