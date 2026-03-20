import { type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { apiKeys } from "@/lib/db/schema";
import { unauthorized, forbidden } from "./response";
import { cookies } from "next/headers";
import * as bcrypt from "bcryptjs";

export type ApiContext = {
  scope: "public" | "private" | "session";
  userId?: string;
  collectionId?: string; // set when verified via API key
};

type RouteHandler = (
  req: NextRequest,
  ctx: ApiContext,
  params: Record<string, string>,
) => Promise<Response>;

function extractKey(req: NextRequest): string | null {
  const auth = req.headers.get("authorization");
  if (auth?.startsWith("Bearer ")) return auth.slice(7).trim();
  return req.headers.get("x-api-key");
}

async function verifyApiKey(rawKey: string): Promise<{
  scope: "public" | "private";
  collectionId: string;
  createdBy: string | null;
} | null> {
  const rows = await db
    .select({
      keyHash: apiKeys.keyHash,
      scope: apiKeys.scope,
      collectionId: apiKeys.collectionId,
      createdBy: apiKeys.createdBy,
      expiresAt: apiKeys.expiresAt,
      revokedAt: apiKeys.revokedAt,
    })
    .from(apiKeys);

  for (const row of rows) {
    if (row.revokedAt) continue;
    if (row.expiresAt && row.expiresAt < new Date()) continue;
    const match = await bcrypt.compare(rawKey, row.keyHash);
    if (match) {
      db.update(apiKeys)
        .set({ lastUsedAt: new Date() })
        .where(eq(apiKeys.keyHash, row.keyHash))
        .catch(() => {});
      return {
        scope: row.scope,
        collectionId: row.collectionId,
        createdBy: row.createdBy,
      };
    }
  }
  return null;
}

export function withPublicKey(handler: RouteHandler) {
  return async (
    req: NextRequest,
    { params }: { params: Promise<Record<string, string>> },
  ) => {
    const resolvedParams = await params;
    const rawKey = extractKey(req);

    if (rawKey) {
      const verified = await verifyApiKey(rawKey);
      if (!verified) return unauthorized("Invalid API key");
      if (verified.scope === "private")
        return forbidden("Use a public key for this endpoint.");
      return handler(
        req,
        {
          scope: "public",
          userId: verified.createdBy ?? undefined,
          collectionId: verified.collectionId,
        },
        resolvedParams,
      );
    }

    return handler(req, { scope: "public" }, resolvedParams);
  };
}

export function withPrivateKey(handler: RouteHandler) {
  return async (
    req: NextRequest,
    { params }: { params: Promise<Record<string, string>> },
  ) => {
    const resolvedParams = await params;
    const rawKey = extractKey(req);

    if (!rawKey) return unauthorized("API key required.");

    const verified = await verifyApiKey(rawKey);
    if (!verified) return unauthorized("Invalid or expired API key");
    if (verified.scope === "public")
      return forbidden("This endpoint requires a private key");

    return handler(
      req,
      {
        scope: "private",
        userId: verified.createdBy ?? undefined,
        collectionId: verified.collectionId,
      },
      resolvedParams,
    );
  };
}

export function withSession(handler: RouteHandler) {
  return async (
    req: NextRequest,
    { params }: { params: Promise<Record<string, string>> },
  ) => {
    const resolvedParams = await params;
    const cookieStore = await cookies();

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
      {
        cookies: {
          getAll: () => cookieStore.getAll(),
          setAll: (toSet) => {
            toSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          },
        },
      },
    );

    const { data, error } = await supabase.auth.getClaims();
    if (error || !data?.claims?.sub) return unauthorized();

    return handler(
      req,
      { scope: "session", userId: data.claims.sub as string },
      resolvedParams,
    );
  };
}
