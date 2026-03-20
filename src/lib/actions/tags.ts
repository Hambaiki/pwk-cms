'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { eq, asc, inArray } from 'drizzle-orm'
import { db } from '@/lib/db'
import { tags, entryTags } from '@/lib/db/schema'
import type { Tag } from '@/lib/db/schema'
import { verifySession } from '@/lib/dal'

// ─── Helpers ───────────────────────────────────────────────────────────────────

function slugify(v: string) {
  return v.toLowerCase().trim()
    .replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-').replace(/^-+|-+$/g, '')
}

// ─── Types ─────────────────────────────────────────────────────────────────────

export type TagFormState = {
  errors?: { name?: string[]; general?: string[] }
  message?: string
} | undefined

// ─── Queries ──────────────────────────────────────────────────────────────────

export async function getTags(): Promise<Tag[]> {
  await verifySession()
  try {
    return await db.select().from(tags).orderBy(asc(tags.name))
  } catch {
    return []
  }
}

export async function getEntryTags(entryId: string): Promise<Tag[]> {
  await verifySession()
  try {
    const rows = await db
      .select({ id: tags.id, name: tags.name, slug: tags.slug, createdAt: tags.createdAt })
      .from(entryTags)
      .innerJoin(tags, eq(entryTags.tagId, tags.id))
      .where(eq(entryTags.entryId, entryId))
      .orderBy(asc(tags.name))
    return rows
  } catch {
    return []
  }
}

// ─── Create tag ────────────────────────────────────────────────────────────────

const CreateTagSchema = z.object({
  name: z.string().min(1, 'Name is required').max(64).trim(),
  slug: z.string().max(64).regex(/^[a-z0-9-]*$/, {
    message: 'Slug can only contain lowercase letters, numbers, and hyphens',
  }).optional(),
})

export async function createTag(
  _state: TagFormState,
  formData: FormData,
): Promise<TagFormState> {
  await verifySession()

  const validated = CreateTagSchema.safeParse({
    name: formData.get('name'),
    slug: formData.get('slug') || undefined,
  })

  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors }
  }

  const { name } = validated.data
  const slug = validated.data.slug || slugify(name)

  // Check uniqueness
  const [existing] = await db
    .select({ id: tags.id })
    .from(tags)
    .where(eq(tags.slug, slug))
    .limit(1)

  if (existing) {
    return { errors: { name: [`A tag with slug "${slug}" already exists.`] } }
  }

  await db.insert(tags).values({ name, slug })

  revalidatePath('/cms/tags')
  return { message: `Tag "${name}" created.` }
}

// ─── Delete tag ────────────────────────────────────────────────────────────────
// entry_tags rows are cascade-deleted by the FK constraint.

export async function deleteTag(id: string): Promise<void> {
  const session = await verifySession()

  if (session.role === 'viewer') return

  await db.delete(tags).where(eq(tags.id, id))
  revalidatePath('/cms/tags')
}

// ─── Set entry tags ────────────────────────────────────────────────────────────
// Replaces the full tag set for an entry in one operation.
// Called from the entry editor when tags change.

export async function setEntryTags(entryId: string, tagIds: string[]): Promise<void> {
  await verifySession()

  // Delete all existing entry_tags for this entry
  await db.delete(entryTags).where(eq(entryTags.entryId, entryId))

  // Insert the new set
  if (tagIds.length > 0) {
    await db.insert(entryTags).values(
      tagIds.map((tagId) => ({ entryId, tagId }))
    )
  }

  revalidatePath(`/cms/editor/${entryId}`)
}
