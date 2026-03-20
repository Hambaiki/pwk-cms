import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { profiles } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

// ─── Verify Session ────────────────────────────────────────────────────────────
// Uses getClaims() which validates the JWT signature every time.
// Never use getSession() in server code — it does not revalidate the token.
// Wrapped in React cache() so it deduplicates calls within a single render pass.

export const verifySession = cache(async () => {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();

  if (error || !data?.claims?.sub) {
    redirect("/auth/login");
  }

  return {
    isAuth: true,
    userId: data.claims.sub as string,
    email: data.claims.email as string | undefined,
    role: (data.claims.user_metadata?.role as string) ?? "user",
  };
});

// ─── Get Current User (with Drizzle profile) ──────────────────────────────────
// Fetches the auth session + the matching profile row from your own DB.
// Returns only the fields needed — never the whole object.

export const getCurrentUser = cache(async () => {
  const session = await verifySession();

  try {
    const rows = await db
      .select({
        id: profiles.id,
        displayName: profiles.displayName,
        email: profiles.email,
        role: profiles.role,
        createdAt: profiles.createdAt,
      })
      .from(profiles)
      .where(eq(profiles.id, session.userId))
      .limit(1);

    return rows[0] ?? null;
  } catch {
    return null;
  }
});

// ─── Get Session Without Redirect ─────────────────────────────────────────────
// Use this when you need to check auth but don't want to redirect (e.g. in
// layouts that render both auth and public content).

export const getOptionalSession = cache(async () => {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();

  if (!data?.claims?.sub) return null;

  return {
    userId: data.claims.sub as string,
    email: data.claims.email as string | undefined,
  };
});
