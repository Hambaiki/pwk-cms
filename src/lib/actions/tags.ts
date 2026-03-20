'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { eq, asc, and } from 'drizzle-orm'
import { db } from '@/lib/db'
import { tags, entryTags } from '@/lib/db/schema'
import type { Tag } from '@/lib/db/schema'
import { verifySession } from '@/lib/dal'
import { requireCollectionRole } from '@/lib/actions/collections'

function slugify(v: string) {
  return v.toLowerCase().trim()
    .replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-').replace(/^-+|-+$/g, '')
}

export type TagFormState = {
  errors?: { name?: string[]; general?: string[] }
  message?: string
} | undefined

// ─── Queries ──────────────────────────────────────────────────────────────────

// Returns tags scoped to a specific collection
export async function getTags(collectionId: string): Promise<Tag[]> {
  await verifySession()
  try {
    return await db
      .select()
      .from(tags)
      .where(eq(tags.collectionId, collectionId))
      .orderBy(asc(tags.name))
  } catch {
    return []
  }
}

export async function getEntryTags(entryId: string): Promise<Tag[]> {
  await verifySession()
  try {
    return await db
      .select({ id: tags.id, name: tags.name, slug: tags.slug, collectionId: tags.collectionId, createdAt: tags.createdAt })
      .from(entryTags)
      .innerJoin(tags, eq(entryTags.tagId, tags.id))
      .where(eq(entryTags.entryId, entryId))
      .orderBy(asc(tags.name))
  } catch {
    return []
  }
}

// ─── Create tag ────────────────────────────────────────────────────────────────

const CreateTagSchema = z.object({
  collectionId: z.string().uuid(),
  name:         z.string().min(1, 'Name is required').max(64).trim(),
  slug:         z.string().max(64).regex(/^[a-z0-9-]*$/).optional(),
})

export async function createTag(
  _state: TagFormState,
  formData: FormData,
): Promise<TagFormState> {
  const session = await verifySession()

  const validated = CreateTagSchema.safeParse({
    collectionId: formData.get('collectionId'),
    name:         formData.get('name'),
    slug:         formData.get('slug') || undefined,
  })

  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors }
  }

  const { collectionId, name } = validated.data
  const slug = validated.data.slug || slugify(name)

  await requireCollectionRole(collectionId, session.userId, 'editor')

  const [existing] = await db
    .select({ id: tags.id })
    .from(tags)
    .where(and(eq(tags.collectionId, collectionId), eq(tags.slug, slug)))
    .limit(1)

  if (existing) {
    return { errors: { name: [`A tag with slug "${slug}" already exists in this collection.`] } }
  }

  await db.insert(tags).values({ collectionId, name, slug })

  revalidatePath(`/cms/tags?collection=${collectionId}`)
  return { message: `Tag "${name}" created.` }
}

// ─── Delete tag ────────────────────────────────────────────────────────────────

export async function deleteTag(id: string): Promise<void> {
  const session = await verifySession()

  const [tag] = await db.select({ collectionId: tags.collectionId }).from(tags).where(eq(tags.id, id)).limit(1)
  if (!tag) return

  await requireCollectionRole(tag.collectionId, session.userId, 'editor')
  await db.delete(tags).where(eq(tags.id, id))
  revalidatePath(`/cms/tags?collection=${tag.collectionId}`)
}

// ─── Set entry tags ────────────────────────────────────────────────────────────

export async function setEntryTags(entryId: string, tagIds: string[]): Promise<void> {
  await verifySession()
  await db.delete(entryTags).where(eq(entryTags.entryId, entryId))
  if (tagIds.length > 0) {
    await db.insert(entryTags).values(tagIds.map((tagId) => ({ entryId, tagId })))
  }
  revalidatePath(`/cms/editor/${entryId}`)
}
