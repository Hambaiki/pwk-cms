"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { eq, and, asc, desc, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { entries, collections, fields, entryTags, tags } from "@/lib/db/schema";
import type { Entry, Collection, Field, Tag } from "@/lib/db/schema";
import { verifySession } from "@/lib/dal";

// ─── Helpers ───────────────────────────────────────────────────────────────────

function slugify(v: string) {
  return v
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// ─── Types ─────────────────────────────────────────────────────────────────────

export type EntryWithCollection = Entry & { collection: Collection };

export type EntryDetail = {
  entry: Entry;
  collection: Collection;
  fields: Field[];
};

export type EntryFormErrors = {
  general?: string[];
  slug?: string[];
};

export type EntryFormState =
  | {
      errors?: EntryFormErrors;
      message?: string;
    }
  | undefined;

// ─── Queries ───────────────────────────────────────────────────────────────────

export async function getEntriesByCollection(collectionSlug: string): Promise<{
  collection: Collection;
  entries: (Entry & { tags: Pick<Tag, "id" | "name" | "slug">[] })[];
} | null> {
  await verifySession();

  let collection: Collection | undefined;
  try {
    [collection] = await db
      .select()
      .from(collections)
      .where(eq(collections.slug, collectionSlug))
      .limit(1);
  } catch (e) {
    console.error("[getEntriesByCollection] collection query failed:", e);
    return null;
  }

  if (!collection) {
    console.error(
      "[getEntriesByCollection] no collection found for slug:",
      collectionSlug,
    );
    return null;
  }

  try {
    const rows = await db
      .select()
      .from(entries)
      .where(eq(entries.collectionId, collection.id))
      .orderBy(desc(entries.updatedAt));

    // Attach tags to each entry
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
  await verifySession();

  const [entry] = await db
    .select()
    .from(entries)
    .where(eq(entries.id, entryId))
    .limit(1);

  if (!entry) return null;

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
// Called when the user picks a collection and clicks "New entry".
// Creates a blank draft and redirects to the editor.

export async function createEntry(collectionId: string): Promise<void> {
  const session = await verifySession();

  const [collection] = await db
    .select()
    .from(collections)
    .where(eq(collections.id, collectionId))
    .limit(1);

  if (!collection) throw new Error("Collection not found");

  // Generate a unique slug based on timestamp
  const baseSlug = `draft-${Date.now()}`;

  const [created] = await db
    .insert(entries)
    .values({
      collectionId,
      slug: baseSlug,
      status: "draft",
      content: {},
      authorId: session.userId,
    })
    .returning({ id: entries.id });

  if (!created) throw new Error("Failed to create entry");

  revalidatePath(`/cms/entries/${collection.slug}`);
  redirect(`/cms/editor/${created.id}`);
}

// ─── Get or create page entry ─────────────────────────────────────────────────
// For is_page collections there should only ever be one entry.
// This action retrieves it, or creates a blank one if it doesn't exist yet,
// then returns the entry id so the caller can redirect to the editor.

export async function getOrCreatePageEntry(
  collectionId: string,
): Promise<string> {
  const session = await verifySession();

  // Find the single entry for this collection
  const [existing] = await db
    .select({ id: entries.id })
    .from(entries)
    .where(eq(entries.collectionId, collectionId))
    .limit(1);

  if (existing) return existing.id;

  // None exists yet — create a blank draft
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
      slug: collection.slug, // use collection slug as the entry slug for pages
      status: "draft",
      content: {},
      authorId: session.userId,
    })
    .returning({ id: entries.id });

  if (!created) throw new Error("Failed to create page entry");

  revalidatePath(`/cms/entries/\${collection.slug}`);
  return created.id;
}

// ─── Save Entry ─────────────────────────────────────────────────────────────────
// Auto-save + manual save from the editor.
// Receives the full content blob (BlockNote JSON) + metadata fields.

const SaveSchema = z.object({
  entryId: z.string().uuid(),
  slug: z
    .string()
    .min(1)
    .max(200)
    .regex(/^[a-z0-9-]+$/, {
      message: "Slug can only contain lowercase letters, numbers, and hyphens",
    }),
  // content is a serialised JSON string from the editor
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
    const fieldErrors = validated.error.flatten().fieldErrors;
    return {
      errors: {
        slug: fieldErrors.slug ?? undefined,
        general: fieldErrors.content ?? undefined,
      } satisfies EntryFormErrors,
    };
  }

  const { entryId, slug } = validated.data;
  let content: unknown;
  try {
    content = JSON.parse(validated.data.content);
  } catch {
    return { errors: { general: ["Invalid content format."] } };
  }

  // Verify entry exists and belongs to the current user (or user is admin)
  const [existing] = await db
    .select()
    .from(entries)
    .where(eq(entries.id, entryId))
    .limit(1);

  if (!existing) return { errors: { general: ["Entry not found."] } };

  if (existing.authorId !== session.userId && session.role !== "admin") {
    return {
      errors: { general: ["You do not have permission to edit this entry."] },
    };
  }

  // Check slug uniqueness within the same collection (excluding self)
  const [slugConflict] = await db
    .select({ id: entries.id })
    .from(entries)
    .where(
      and(
        eq(entries.collectionId, existing.collectionId),
        eq(entries.slug, slug),
      ),
    )
    .limit(1);

  if (slugConflict && slugConflict.id !== entryId) {
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

// ─── Publish / Unpublish ────────────────────────────────────────────────────────

export async function publishEntry(entryId: string): Promise<void> {
  await verifySession();

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
  await verifySession();

  await db
    .update(entries)
    .set({ status: "draft", publishedAt: null, updatedAt: new Date() })
    .where(eq(entries.id, entryId));

  revalidatePath(`/cms/editor/${entryId}`);
}

// ─── Delete Entry ───────────────────────────────────────────────────────────────

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

  if (entry.authorId !== session.userId && session.role !== "admin") {
    throw new Error("Permission denied");
  }

  await db.delete(entries).where(eq(entries.id, entryId));

  revalidatePath(`/cms/entries/${collectionSlug}`);
  redirect(`/cms/entries/${collectionSlug}`);
}
