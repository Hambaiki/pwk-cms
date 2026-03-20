"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { eq, desc } from "drizzle-orm";
import { db } from "@/lib/db";
import { apiKeys } from "@/lib/db/schema";
import { verifySession } from "@/lib/dal";
import { generateApiKey } from "@/lib/api/keys";

// ─── Types ─────────────────────────────────────────────────────────────────────

export type ApiKeyRow = {
  id: string;
  name: string;
  scope: "public" | "private";
  createdAt: Date;
  expiresAt: Date | null;
  lastUsedAt: Date | null;
  revokedAt: Date | null;
};

export type CreateKeyState =
  | {
      errors?: { name?: string[]; general?: string[] };
      created?: { rawKey: string; name: string; scope: "public" | "private" };
    }
  | undefined;

const CreateKeySchema = z.object({
  name: z.string().min(1, "Name is required").max(64).trim(),
  scope: z.enum(["public", "private"]),
  expiresAt: z.string().optional(),
});

// ─── List keys ─────────────────────────────────────────────────────────────────

export async function getApiKeys(): Promise<ApiKeyRow[]> {
  const session = await verifySession();

  // Viewers can't see API keys
  if (session.role === "viewer") return [];

  try {
    const rows = await db
      .select({
        id: apiKeys.id,
        name: apiKeys.name,
        scope: apiKeys.scope,
        createdAt: apiKeys.createdAt,
        expiresAt: apiKeys.expiresAt,
        lastUsedAt: apiKeys.lastUsedAt,
        revokedAt: apiKeys.revokedAt,
      })
      .from(apiKeys)
      .where(
        session.role === "admin"
          ? undefined
          : eq(apiKeys.createdBy, session.userId),
      )
      .orderBy(desc(apiKeys.createdAt));
    return rows as ApiKeyRow[];
  } catch {
    return [];
  }
}

// ─── Create key ─────────────────────────────────────────────────────────────────

export async function createApiKey(
  _state: CreateKeyState,
  formData: FormData,
): Promise<CreateKeyState> {
  const session = await verifySession();

  if (session.role === "viewer") {
    return { errors: { general: ["Viewers cannot create API keys."] } };
  }

  const validated = CreateKeySchema.safeParse({
    name: formData.get("name"),
    scope: formData.get("scope"),
    expiresAt: formData.get("expiresAt") || undefined,
  });

  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors };
  }

  const { name, scope, expiresAt: expiresRaw } = validated.data;

  let expiresAt: Date | undefined;
  if (expiresRaw) {
    expiresAt = new Date(expiresRaw);
    if (isNaN(expiresAt.getTime())) {
      return { errors: { general: ["Invalid expiry date."] } };
    }
  }

  const created = await generateApiKey(name, scope, session.userId, expiresAt);

  revalidatePath("/cms/settings/api-keys");

  return {
    created: {
      rawKey: created.rawKey,
      name: created.name,
      scope: created.scope,
    },
  };
}

// ─── Revoke key ─────────────────────────────────────────────────────────────────

export async function revokeApiKey(id: string): Promise<void> {
  const session = await verifySession();

  const [key] = await db
    .select({ createdBy: apiKeys.createdBy })
    .from(apiKeys)
    .where(eq(apiKeys.id, id))
    .limit(1);

  if (!key) return;

  // Only the owner or an admin can revoke
  if (key.createdBy !== session.userId && session.role !== "admin") return;

  await db
    .update(apiKeys)
    .set({ revokedAt: new Date() })
    .where(eq(apiKeys.id, id));

  revalidatePath("/cms/settings/api-keys");
}
