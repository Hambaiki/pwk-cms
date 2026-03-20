import { type NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { entries } from "@/lib/db/schema";
import { withPrivateKey } from "@/lib/api/middleware";
import {
  ok,
  badRequest,
  notFound,
  forbidden,
  serverError,
} from "@/lib/api/response";
import type { ApiContext } from "@/lib/api/middleware";

const PatchEntrySchema = z
  .object({
    slug: z
      .string()
      .min(1)
      .max(200)
      .regex(/^[a-z0-9-]+$/)
      .optional(),
    content: z.record(z.string(), z.unknown()).optional(),
    status: z.enum(["draft", "published", "archived"]).optional(),
  })
  .refine((d) => Object.keys(d).length > 0, {
    message: "At least one field (slug, content, status) must be provided",
  });

export const PATCH = withPrivateKey(
  async (req: NextRequest, ctx: ApiContext, params) => {
    if (!ctx.collectionId)
      return forbidden("API key is not scoped to a collection");

    const { id } = params;
    const [existing] = await db
      .select({
        id: entries.id,
        collectionId: entries.collectionId,
        status: entries.status,
      })
      .from(entries)
      .where(eq(entries.id, id))
      .limit(1);

    if (!existing) return notFound(`Entry "${id}" not found`);

    // Ensure the key's collection matches the entry's collection
    if (existing.collectionId !== ctx.collectionId) {
      return forbidden("This API key is not authorised to modify this entry");
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return badRequest("Request body must be valid JSON");
    }

    const validated = PatchEntrySchema.safeParse(body);
    if (!validated.success) {
      return badRequest(
        validated.error.issues.map((i) => i.message).join(", "),
      );
    }

    const patch = validated.data;
    const update: Record<string, unknown> = { updatedAt: new Date() };

    if (patch.slug) update.slug = patch.slug;
    if (patch.content) update.content = patch.content;
    if (patch.status) {
      update.status = patch.status;
      if (patch.status === "published" && existing.status !== "published") {
        update.publishedAt = new Date();
      } else if (patch.status !== "published") {
        update.publishedAt = null;
      }
    }

    try {
      const [updated] = await db
        .update(entries)
        .set(update)
        .where(eq(entries.id, id))
        .returning();
      return ok(updated);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "";
      if (msg.includes("unique") || msg.includes("duplicate")) {
        return badRequest(
          `Slug "${patch.slug}" is already in use in this collection`,
        );
      }
      return serverError();
    }
  },
);

export const DELETE = withPrivateKey(
  async (_req: NextRequest, ctx: ApiContext, params) => {
    if (!ctx.collectionId)
      return forbidden("API key is not scoped to a collection");

    const { id } = params;
    const [existing] = await db
      .select({ id: entries.id, collectionId: entries.collectionId })
      .from(entries)
      .where(eq(entries.id, id))
      .limit(1);

    if (!existing) return notFound(`Entry "${id}" not found`);

    if (existing.collectionId !== ctx.collectionId) {
      return forbidden("This API key is not authorised to delete this entry");
    }

    await db.delete(entries).where(eq(entries.id, id));
    return ok({ deleted: true });
  },
);
