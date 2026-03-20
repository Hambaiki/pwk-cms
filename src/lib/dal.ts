import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { profiles } from "@/lib/db/schema";
import type { Profile } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

// ─── Session type ──────────────────────────────────────────────────────────────
// No global role — access is determined per-collection via collection_members.

export type Session = {
  isAuth: true;
  userId: string;
  email: string;
};

// ─── verifySession ─────────────────────────────────────────────────────────────
// Validates the JWT signature on every call via getClaims().
// Never use getSession() — it does not revalidate the token.
// Wrapped in React cache() so it deduplicates within a single render pass.

export const verifySession = cache(async (): Promise<Session> => {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();

  if (error || !data?.claims?.sub) {
    redirect("/login");
  }

  return {
    isAuth: true,
    userId: data.claims.sub as string,
    email: (data.claims.email as string) ?? "",
  };
});

// ─── getCurrentUser ────────────────────────────────────────────────────────────
// Returns the full profile row for the current user, or null if not found.

export const getCurrentUser = cache(async (): Promise<Profile | null> => {
  const session = await verifySession();

  try {
    const [profile] = await db
      .select()
      .from(profiles)
      .where(eq(profiles.id, session.userId))
      .limit(1);

    return profile ?? null;
  } catch {
    return null;
  }
});

// ─── getOptionalSession ────────────────────────────────────────────────────────
// Returns the session without redirecting — for layouts that render differently
// based on auth state but do not require authentication.

export const getOptionalSession = cache(async (): Promise<Session | null> => {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();

  if (!data?.claims?.sub) return null;

  return {
    isAuth: true,
    userId: data.claims.sub as string,
    email: (data.claims.email as string) ?? "",
  };
});
