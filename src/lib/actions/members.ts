'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { eq, and, ne } from 'drizzle-orm'
import { db } from '@/lib/db'
import { collectionMembers, profiles } from '@/lib/db/schema'
import type { MemberRole } from '@/lib/db/schema'
import { verifySession } from '@/lib/dal'
import { requireCollectionRole } from '@/lib/actions/collections'

export type MemberRow = {
  id:          string
  userId:      string
  email:       string
  displayName: string | null
  role:        MemberRole
  createdAt:   Date
}

export type MemberFormState = {
  errors?: { email?: string[]; general?: string[] }
  message?: string
} | undefined

const AddMemberSchema = z.object({
  collectionId: z.string().uuid(),
  email:        z.string().email('Invalid email address').trim().toLowerCase(),
  role:         z.enum(['editor', 'viewer']),
})

// ─── Get members ──────────────────────────────────────────────────────────────

export async function getCollectionMembers(collectionId: string): Promise<MemberRow[]> {
  const session = await verifySession()
  await requireCollectionRole(collectionId, session.userId, 'owner')

  const rows = await db
    .select({
      id:          collectionMembers.id,
      userId:      collectionMembers.userId,
      email:       profiles.email,
      displayName: profiles.displayName,
      role:        collectionMembers.role,
      createdAt:   collectionMembers.createdAt,
    })
    .from(collectionMembers)
    .innerJoin(profiles, eq(collectionMembers.userId, profiles.id))
    .where(eq(collectionMembers.collectionId, collectionId))

  return rows as MemberRow[]
}

// ─── Add member by email ───────────────────────────────────────────────────────
// Looks up an existing profile by email and adds them as a member.
// Users must already have an account — invite flow is a future addition.

export async function addMember(
  _state: MemberFormState,
  formData: FormData,
): Promise<MemberFormState> {
  const session = await verifySession()

  const validated = AddMemberSchema.safeParse({
    collectionId: formData.get('collectionId'),
    email:        formData.get('email'),
    role:         formData.get('role'),
  })

  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors }
  }

  const { collectionId, email, role } = validated.data

  await requireCollectionRole(collectionId, session.userId, 'owner')

  // Look up the user profile by email
  const [profile] = await db
    .select({ id: profiles.id })
    .from(profiles)
    .where(eq(profiles.email, email))
    .limit(1)

  if (!profile) {
    return {
      errors: {
        email: [`No account found for ${email}. They need to sign up first.`],
      },
    }
  }

  // Don't add the owner themselves
  if (profile.id === session.userId) {
    return { errors: { email: ['You cannot add yourself as a member.'] } }
  }

  // Upsert — if already a member, update their role
  await db
    .insert(collectionMembers)
    .values({ collectionId, userId: profile.id, role, invitedBy: session.userId })
    .onConflictDoUpdate({
      target:  [collectionMembers.collectionId, collectionMembers.userId],
      set:     { role },
    })

  revalidatePath(`/cms/collections/${collectionId}`)
  return { message: `${email} added as ${role}.` }
}

// ─── Update member role ────────────────────────────────────────────────────────

export async function updateMemberRole(
  memberId: string,
  role: MemberRole,
): Promise<void> {
  const session = await verifySession()

  const [member] = await db
    .select({ collectionId: collectionMembers.collectionId })
    .from(collectionMembers)
    .where(eq(collectionMembers.id, memberId))
    .limit(1)

  if (!member) return

  await requireCollectionRole(member.collectionId, session.userId, 'owner')

  await db
    .update(collectionMembers)
    .set({ role })
    .where(eq(collectionMembers.id, memberId))

  revalidatePath(`/cms/collections/${member.collectionId}`)
}

// ─── Remove member ─────────────────────────────────────────────────────────────

export async function removeMember(memberId: string): Promise<void> {
  const session = await verifySession()

  const [member] = await db
    .select({ collectionId: collectionMembers.collectionId, userId: collectionMembers.userId, role: collectionMembers.role })
    .from(collectionMembers)
    .where(eq(collectionMembers.id, memberId))
    .limit(1)

  if (!member) return

  // Cannot remove the owner
  if (member.role === 'owner') return

  await requireCollectionRole(member.collectionId, session.userId, 'owner')

  await db.delete(collectionMembers).where(eq(collectionMembers.id, memberId))
  revalidatePath(`/cms/collections/${member.collectionId}`)
}
