"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { eq, asc } from "drizzle-orm";
import { db } from "@/lib/db";
import { collections, fields } from "@/lib/db/schema";
import type {
  NewCollection,
  NewField,
  Collection,
  Field,
} from "@/lib/db/schema";
import { verifySession } from "@/lib/dal";

// ─── Helpers ───────────────────────────────────────────────────────────────────

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// ─── Schemas ───────────────────────────────────────────────────────────────────

const CollectionSchema = z.object({
  name: z.string().min(1, "Name is required").max(64).trim(),
  slug: z
    .string()
    .min(1)
    .max(64)
    .regex(/^[a-z0-9-]+$/, {
      message: "Slug can only contain lowercase letters, numbers, and hyphens",
    })
    .optional(),
  description: z.string().max(256).optional(),
  icon: z.string().max(8).optional(),
  isPage: z.coerce.boolean().optional().default(false),
});

const FieldSchema = z.object({
  id: z.string().uuid().optional(), // present on update, absent on create
  name: z.string().min(1, "Field name is required").max(64).trim(),
  slug: z
    .string()
    .min(1)
    .max(64)
    .regex(/^[a-z0-9_]+$/, {
      message:
        "Field slug can only contain lowercase letters, numbers, and underscores",
    }),
  type: z.enum([
    "text",
    "textarea",
    "richtext",
    "number",
    "boolean",
    "date",
    "media",
    "relation",
    "select",
    "tags",
  ]),
  required: z.coerce.boolean().default(false),
  multiple: z.coerce.boolean().default(false),
  sortOrder: z.coerce.number().int().default(0),
  options: z.record(z.string(), z.unknown()).optional().nullable(),
});

const UpsertFieldsSchema = z.object({
  collectionId: z.string().uuid(),
  fields: z.array(FieldSchema),
  deletedFieldIds: z.array(z.string().uuid()).default([]),
});

export type CollectionFormState =
  | {
      errors?: {
        name?: string[];
        slug?: string[];
        description?: string[];
        icon?: string[];
        general?: string[];
      };
      message?: string;
    }
  | undefined;

export type FieldsFormState =
  | {
      errors?: { general?: string[] };
      message?: string;
    }
  | undefined;

// ─── Queries (called from Server Components — no 'use server' needed there) ───

export async function getCollections(): Promise<Collection[]> {
  await verifySession();
  try {
    return await db
      .select()
      .from(collections)
      .orderBy(asc(collections.createdAt));
  } catch {
    // Table may not exist yet (migrations not run) — return empty list
    return [];
  }
}

export async function getCollectionById(
  id: string,
): Promise<{ collection: Collection; fields: Field[] } | null> {
  await verifySession();

  const [collection] = await db
    .select()
    .from(collections)
    .where(eq(collections.id, id))
    .limit(1);

  if (!collection) return null;

  const collectionFields = await db
    .select()
    .from(fields)
    .where(eq(fields.collectionId, id))
    .orderBy(asc(fields.sortOrder), asc(fields.createdAt));

  return { collection, fields: collectionFields };
}

// ─── Create Collection ─────────────────────────────────────────────────────────

export async function createCollection(
  _state: CollectionFormState,
  formData: FormData,
): Promise<CollectionFormState> {
  const session = await verifySession();

  const validated = CollectionSchema.safeParse({
    name: formData.get("name"),
    slug: formData.get("slug") || undefined,
    description: formData.get("description") || undefined,
    icon: formData.get("icon") || undefined,
    isPage: formData.get("isPage"),
  });

  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors };
  }

  const { name, description, icon, isPage } = validated.data;
  const slug = validated.data.slug ?? slugify(name);

  // Check slug uniqueness
  const [existing] = await db
    .select({ id: collections.id })
    .from(collections)
    .where(eq(collections.slug, slug))
    .limit(1);

  if (existing) {
    return { errors: { slug: [`The slug "${slug}" is already taken.`] } };
  }

  const [created] = await db
    .insert(collections)
    .values({
      name,
      slug,
      description,
      icon,
      isPage,
      createdBy: session.userId,
    } satisfies NewCollection)
    .returning({ id: collections.id });

  if (!created) {
    return {
      errors: { general: ["Failed to create collection. Please try again."] },
    };
  }

  revalidatePath("/cms/collections");
  redirect(`/cms/collections/${created.id}`);
}

// ─── Update Collection ─────────────────────────────────────────────────────────

export async function updateCollection(
  id: string,
  _state: CollectionFormState,
  formData: FormData,
): Promise<CollectionFormState> {
  await verifySession();

  const validated = CollectionSchema.safeParse({
    name: formData.get("name"),
    slug: formData.get("slug") || undefined,
    description: formData.get("description") || undefined,
    icon: formData.get("icon") || undefined,
    isPage: formData.get("isPage"),
  });

  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors };
  }

  const { name, description, icon, isPage } = validated.data;
  const slug = validated.data.slug ?? slugify(name);

  // Check slug uniqueness (excluding self)
  const [existing] = await db
    .select({ id: collections.id })
    .from(collections)
    .where(eq(collections.slug, slug))
    .limit(1);

  if (existing && existing.id !== id) {
    return { errors: { slug: [`The slug "${slug}" is already taken.`] } };
  }

  await db
    .update(collections)
    .set({ name, slug, description, icon, isPage })
    .where(eq(collections.id, id));

  revalidatePath("/cms/collections");
  revalidatePath(`/cms/collections/${id}`);

  return { message: "Collection updated." };
}

// ─── Delete Collection ─────────────────────────────────────────────────────────
// Fields and entries are cascade-deleted by the DB FK constraints.

export async function deleteCollection(id: string): Promise<void> {
  const session = await verifySession();

  if (session.role !== "admin") {
    throw new Error("Only admins can delete collections.");
  }

  await db.delete(collections).where(eq(collections.id, id));

  revalidatePath("/cms/collections");
  redirect("/cms/collections");
}

// ─── Upsert Fields ─────────────────────────────────────────────────────────────
// Handles the full field list in one shot:
//   1. Delete any field ids in `deletedFieldIds`
//   2. Update existing fields (those with an id)
//   3. Insert new fields (those without an id)
// This keeps sortOrder consistent with whatever order the UI sends.

export async function upsertFields(
  _state: FieldsFormState,
  formData: FormData,
): Promise<FieldsFormState> {
  await verifySession();

  // The schema builder serialises the field list as JSON in a single hidden input
  const raw = formData.get("fieldsPayload");
  if (typeof raw !== "string") {
    return { errors: { general: ["Invalid fields payload."] } };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { errors: { general: ["Could not parse fields payload."] } };
  }

  const validated = UpsertFieldsSchema.safeParse(parsed);
  if (!validated.success) {
    return {
      errors: { general: validated.error.issues.map((i) => i.message) },
    };
  }

  const { collectionId, fields: fieldList, deletedFieldIds } = validated.data;

  // Verify collection exists
  const [collection] = await db
    .select({ id: collections.id })
    .from(collections)
    .where(eq(collections.id, collectionId))
    .limit(1);

  if (!collection) {
    return { errors: { general: ["Collection not found."] } };
  }

  // 1. Delete removed fields
  if (deletedFieldIds.length > 0) {
    for (const fieldId of deletedFieldIds) {
      await db.delete(fields).where(eq(fields.id, fieldId));
    }
  }

  // 2. Update or insert each field
  for (const field of fieldList) {
    if (field.id) {
      await db
        .update(fields)
        .set({
          name: field.name,
          slug: field.slug,
          type: field.type,
          required: field.required,
          multiple: field.multiple,
          sortOrder: field.sortOrder,
          options: field.options ?? null,
        })
        .where(eq(fields.id, field.id));
    } else {
      await db
        .insert(fields)
        .values({
          collectionId,
          name: field.name,
          slug: field.slug,
          type: field.type,
          required: field.required,
          multiple: field.multiple,
          sortOrder: field.sortOrder,
          options: field.options ?? null,
        } satisfies NewField)
        .onConflictDoNothing();
    }
  }

  revalidatePath(`/cms/collections/${collectionId}`);
  return { message: "Fields saved." };
}
