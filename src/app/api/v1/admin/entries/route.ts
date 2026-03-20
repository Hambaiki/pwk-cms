import { type NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { entries, collections } from "@/lib/db/schema";
import { withPrivateKey } from "@/lib/api/middleware";
import { ok, badRequest, notFound, serverError } from "@/lib/api/response";
import type { ApiContext } from "@/lib/api/middleware";

const CreateEntrySchema = z.object({
  collectionSlug: z.string().min(1),
  slug: z
    .string()
    .min(1)
    .max(200)
    .regex(/^[a-z0-9-]+$/),
  content: z.record(z.string(), z.unknown()).default({}),
  status: z.enum(["draft", "published"]).default("draft"),
});

export const POST = withPrivateKey(
  async (req: NextRequest, ctx: ApiContext) => {
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return badRequest("Request body must be valid JSON");
    }

    const validated = CreateEntrySchema.safeParse(body);
    if (!validated.success) {
      return badRequest(
        validated.error.issues.map((i) => i.message).join(", "),
      );
    }

    const { collectionSlug, slug, content, status } = validated.data;

    const [collection] = await db
      .select({ id: collections.id })
      .from(collections)
      .where(eq(collections.slug, collectionSlug))
      .limit(1);

    if (!collection)
      return notFound(`Collection "${collectionSlug}" not found`);

    try {
      const [created] = await db
        .insert(entries)
        .values({
          collectionId: collection.id,
          slug,
          content,
          status,
          authorId: ctx.userId ?? null,
          publishedAt: status === "published" ? new Date() : null,
        })
        .returning();

      return ok(created, 201);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "";
      if (msg.includes("unique") || msg.includes("duplicate")) {
        return badRequest(
          `An entry with slug "${slug}" already exists in this collection`,
        );
      }
      return serverError();
    }
  },
);
