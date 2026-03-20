'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { eq, asc, and } from 'drizzle-orm'
import { db } from '@/lib/db'
import { collections, collectionMembers, fields } from '@/lib/db/schema'
import type { NewCollection, NewField, Collection, Field, MemberRole } from '@/lib/db/schema'
import { verifySession } from '@/lib/dal'

// ─── Helpers ───────────────────────────────────────────────────────────────────

function slugify(value: string) {
  return value.toLowerCase().trim()
    .replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-').replace(/^-+|-+$/g, '')
}

// ─── Permission helper ─────────────────────────────────────────────────────────
// Returns the current user's role in a collection, or null if not a member.

export async function getCollectionRole(
  collectionId: string,
  userId: string,
): Promise<MemberRole | null> {
  const [member] = await db
    .select({ role: collectionMembers.role })
    .from(collectionMembers)
    .where(
      and(
        eq(collectionMembers.collectionId, collectionId),
        eq(collectionMembers.userId, userId),
      ),
    )
    .limit(1)
  return (member?.role as MemberRole) ?? null
}

export async function requireCollectionRole(
  collectionId: string,
  userId: string,
  minimum: MemberRole,
): Promise<MemberRole> {
  const role = await getCollectionRole(collectionId, userId)
  const order: MemberRole[] = ['viewer', 'editor', 'owner']
  if (!role || order.indexOf(role) < order.indexOf(minimum)) {
    throw new Error('Insufficient permissions')
  }
  return role
}

// ─── Schemas ───────────────────────────────────────────────────────────────────

const CollectionSchema = z.object({
  name:        z.string().min(1, 'Name is required').max(64).trim(),
  slug:        z.string().min(1).max(64).regex(/^[a-z0-9-]+$/, {
    message: 'Slug can only contain lowercase letters, numbers, and hyphens',
  }).optional(),
  description: z.string().max(256).optional(),
  icon:        z.string().max(8).optional(),
  isPage:      z.coerce.boolean().optional().default(false),
})

const FieldSchema = z.object({
  id:        z.string().uuid().optional(),
  name:      z.string().min(1, 'Field name is required').max(64).trim(),
  slug:      z.string().min(1).max(64).regex(/^[a-z0-9_]+$/),
  type:      z.enum(['text','textarea','richtext','number','boolean','date','media','relation','select','tags']),
  required:  z.coerce.boolean().default(false),
  multiple:  z.coerce.boolean().default(false),
  sortOrder: z.coerce.number().int().default(0),
  options:   z.record(z.string(), z.unknown()).optional().nullable(),
})

const UpsertFieldsSchema = z.object({
  collectionId:    z.string().uuid(),
  fields:          z.array(FieldSchema),
  deletedFieldIds: z.array(z.string().uuid()).default([]),
})

export type CollectionFormState = {
  errors?: {
    name?: string[]
    slug?: string[]
    description?: string[]
    icon?: string[]
    general?: string[]
  }
  message?: string
} | undefined

export type FieldsFormState = {
  errors?: { general?: string[] }
  message?: string
} | undefined

// ─── Queries ───────────────────────────────────────────────────────────────────

// Returns only collections the current user is a member of (owns or was invited to).
export async function getCollections(): Promise<
  (Collection & { role: MemberRole })[]
> {
  const session = await verifySession()
  try {
    const rows = await db
      .select({
        id:          collections.id,
        name:        collections.name,
        slug:        collections.slug,
        description: collections.description,
        icon:        collections.icon,
        isPage:      collections.isPage,
        ownerId:     collections.ownerId,
        createdAt:   collections.createdAt,
        updatedAt:   collections.updatedAt,
        role:        collectionMembers.role,
      })
      .from(collectionMembers)
      .innerJoin(collections, eq(collectionMembers.collectionId, collections.id))
      .where(eq(collectionMembers.userId, session.userId))
      .orderBy(asc(collections.createdAt))
    return rows as (Collection & { role: MemberRole })[]
  } catch {
    return []
  }
}

export async function getCollectionById(
  id: string,
): Promise<{ collection: Collection; fields: Field[]; role: MemberRole } | null> {
  const session = await verifySession()

  const role = await getCollectionRole(id, session.userId)
  if (!role) return null // not a member — treat as not found

  const [collection] = await db
    .select()
    .from(collections)
    .where(eq(collections.id, id))
    .limit(1)

  if (!collection) return null

  const collectionFields = await db
    .select()
    .from(fields)
    .where(eq(fields.collectionId, id))
    .orderBy(asc(fields.sortOrder), asc(fields.createdAt))

  return { collection, fields: collectionFields, role }
}

// ─── Create Collection ─────────────────────────────────────────────────────────
// Creates the collection and inserts the creator as 'owner' in collection_members.

export async function createCollection(
  _state: CollectionFormState,
  formData: FormData,
): Promise<CollectionFormState> {
  const session = await verifySession()

  const validated = CollectionSchema.safeParse({
    name:        formData.get('name'),
    slug:        formData.get('slug') || undefined,
    description: formData.get('description') || undefined,
    icon:        formData.get('icon') || undefined,
    isPage:      formData.get('isPage'),
  })

  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors }
  }

  const { name, description, icon, isPage } = validated.data
  const slug = validated.data.slug ?? slugify(name)

  // Slug must be unique per owner
  const [existing] = await db
    .select({ id: collections.id })
    .from(collections)
    .where(and(eq(collections.ownerId, session.userId), eq(collections.slug, slug)))
    .limit(1)

  if (existing) {
    return { errors: { slug: [`You already have a collection with slug "${slug}".`] } }
  }

  // Insert collection + owner membership in one transaction
  const [created] = await db
    .insert(collections)
    .values({
      name, slug, description, icon, isPage,
      ownerId: session.userId,
    } satisfies NewCollection)
    .returning({ id: collections.id })

  if (!created) {
    return { errors: { general: ['Failed to create collection. Please try again.'] } }
  }

  // Insert creator as owner member
  await db.insert(collectionMembers).values({
    collectionId: created.id,
    userId:       session.userId,
    role:         'owner',
  })

  revalidatePath('/cms/collections')
  redirect(`/cms/collections/${created.id}`)
}

// ─── Update Collection ─────────────────────────────────────────────────────────

export async function updateCollection(
  id: string,
  _state: CollectionFormState,
  formData: FormData,
): Promise<CollectionFormState> {
  const session = await verifySession()
  await requireCollectionRole(id, session.userId, 'owner')

  const validated = CollectionSchema.safeParse({
    name:        formData.get('name'),
    slug:        formData.get('slug') || undefined,
    description: formData.get('description') || undefined,
    icon:        formData.get('icon') || undefined,
    isPage:      formData.get('isPage'),
  })

  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors }
  }

  const { name, description, icon, isPage } = validated.data
  const slug = validated.data.slug ?? slugify(name)

  // Check slug uniqueness per owner (excluding self)
  const [existing] = await db
    .select({ id: collections.id })
    .from(collections)
    .where(and(eq(collections.ownerId, session.userId), eq(collections.slug, slug)))
    .limit(1)

  if (existing && existing.id !== id) {
    return { errors: { slug: [`You already have a collection with slug "${slug}".`] } }
  }

  await db
    .update(collections)
    .set({ name, slug, description, icon, isPage })
    .where(eq(collections.id, id))

  revalidatePath('/cms/collections')
  revalidatePath(`/cms/collections/${id}`)
  return { message: 'Collection updated.' }
}

// ─── Delete Collection ─────────────────────────────────────────────────────────

export async function deleteCollection(id: string): Promise<void> {
  const session = await verifySession()
  await requireCollectionRole(id, session.userId, 'owner')

  await db.delete(collections).where(eq(collections.id, id))

  revalidatePath('/cms/collections')
  redirect('/cms/collections')
}

// ─── Upsert Fields ─────────────────────────────────────────────────────────────

export async function upsertFields(
  _state: FieldsFormState,
  formData: FormData,
): Promise<FieldsFormState> {
  const session = await verifySession()

  const raw = formData.get('fieldsPayload')
  if (typeof raw !== 'string') {
    return { errors: { general: ['Invalid fields payload.'] } }
  }

  let parsed: unknown
  try { parsed = JSON.parse(raw) } catch {
    return { errors: { general: ['Could not parse fields payload.'] } }
  }

  const validated = UpsertFieldsSchema.safeParse(parsed)
  if (!validated.success) {
    return { errors: { general: validated.error.issues.map((i) => i.message) } }
  }

  const { collectionId, fields: fieldList, deletedFieldIds } = validated.data

  await requireCollectionRole(collectionId, session.userId, 'owner')

  if (deletedFieldIds.length > 0) {
    for (const fieldId of deletedFieldIds) {
      await db.delete(fields).where(eq(fields.id, fieldId))
    }
  }

  for (const field of fieldList) {
    if (field.id) {
      await db.update(fields).set({
        name: field.name, slug: field.slug, type: field.type,
        required: field.required, multiple: field.multiple,
        sortOrder: field.sortOrder, options: field.options ?? null,
      }).where(eq(fields.id, field.id))
    } else {
      await db.insert(fields).values({
        collectionId, name: field.name, slug: field.slug, type: field.type,
        required: field.required, multiple: field.multiple,
        sortOrder: field.sortOrder, options: field.options ?? null,
      } satisfies NewField).onConflictDoNothing()
    }
  }

  revalidatePath(`/cms/collections/${collectionId}`)
  return { message: 'Fields saved.' }
}
