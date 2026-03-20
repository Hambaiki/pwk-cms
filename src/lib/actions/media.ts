"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { eq, desc, like, and, count } from "drizzle-orm";
import { createClient as createSupabaseServer } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { media } from "@/lib/db/schema";
import type { Media } from "@/lib/db/schema";
import { verifySession } from "@/lib/dal";

// ─── Constants ─────────────────────────────────────────────────────────────────

const BUCKET = "cms-media";
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB
const ACCEPTED_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/svg+xml",
  "image/avif",
  "video/mp4",
  "video/webm",
  "application/pdf",
  "text/plain",
  "text/csv",
  "application/zip",
]);

// ─── Types ─────────────────────────────────────────────────────────────────────

export type MediaListResult = {
  items: Media[];
  total: number;
  page: number;
  totalPages: number;
};

export type UploadState =
  | {
      errors?: { general?: string[] };
      uploaded?: Media[];
    }
  | undefined;

// ─── List media ────────────────────────────────────────────────────────────────

export async function getMedia(
  opts: {
    folder?: string;
    search?: string;
    mimePrefix?: string; // e.g. 'image/' to filter by type
    page?: number;
    limit?: number;
  } = {},
): Promise<MediaListResult> {
  await verifySession();

  const page = Math.max(1, opts.page ?? 1);
  const limit = Math.min(100, opts.limit ?? 40);
  const offset = (page - 1) * limit;

  const conditions = [];
  if (opts.folder) conditions.push(eq(media.folder, opts.folder));
  if (opts.search) conditions.push(like(media.filename, `%${opts.search}%`));
  if (opts.mimePrefix)
    conditions.push(like(media.mimeType, `${opts.mimePrefix}%`));

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  try {
    const [items, [{ total }]] = await Promise.all([
      db
        .select()
        .from(media)
        .where(where)
        .orderBy(desc(media.createdAt))
        .limit(limit)
        .offset(offset),
      db.select({ total: count() }).from(media).where(where),
    ]);

    return {
      items,
      total: Number(total),
      page,
      totalPages: Math.ceil(Number(total) / limit),
    };
  } catch {
    // Table may not exist yet — return empty result until migrations are run
    return { items: [], total: 0, page, totalPages: 0 };
  }
}

// ─── Upload ────────────────────────────────────────────────────────────────────
// Accepts a FormData with one or more files under the key "files".
// Uploads each to Supabase Storage, then inserts a metadata row into the DB.

export async function uploadMedia(
  _state: UploadState,
  formData: FormData,
): Promise<UploadState> {
  const session = await verifySession();

  const files = formData.getAll("files") as File[];
  const folder = (formData.get("folder") as string | null) ?? "/";

  if (!files.length) {
    return { errors: { general: ["No files provided."] } };
  }

  const supabase = await createSupabaseServer();
  const uploaded: Media[] = [];
  const errors: string[] = [];

  for (const file of files) {
    // Validate
    if (file.size > MAX_FILE_SIZE) {
      errors.push(`"${file.name}" exceeds the 50 MB limit.`);
      continue;
    }
    if (!ACCEPTED_MIME.has(file.type)) {
      errors.push(`"${file.name}" — unsupported file type (${file.type}).`);
      continue;
    }

    // Build a unique storage path: folder/userId/timestamp-filename
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const storagePath = [
      folder.replace(/^\//, ""),
      session.userId,
      `${Date.now()}-${safeName}`,
    ]
      .filter(Boolean)
      .join("/");

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(storagePath, file, { contentType: file.type, upsert: false });

    if (uploadError) {
      errors.push(`"${file.name}" failed to upload: ${uploadError.message}`);
      continue;
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from(BUCKET).getPublicUrl(storagePath);

    // Read image dimensions if applicable
    let width: number | null = null;
    let height: number | null = null;

    // Insert metadata row
    const [row] = await db
      .insert(media)
      .values({
        filename: file.name,
        storagePath,
        publicUrl,
        mimeType: file.type,
        size: file.size,
        width,
        height,
        folder,
        uploadedBy: session.userId,
      })
      .returning();

    uploaded.push(row);
  }

  revalidatePath("/cms/media");

  if (errors.length > 0 && uploaded.length === 0) {
    return { errors: { general: errors } };
  }

  return { uploaded, errors: errors.length ? { general: errors } : undefined };
}

// ─── Update alt text ───────────────────────────────────────────────────────────

export async function updateMediaAlt(id: string, alt: string): Promise<void> {
  await verifySession();
  await db.update(media).set({ alt }).where(eq(media.id, id));
  revalidatePath("/cms/media");
}

// ─── Delete ────────────────────────────────────────────────────────────────────

export async function deleteMedia(id: string): Promise<{ error?: string }> {
  const session = await verifySession();

  const [row] = await db
    .select({ storagePath: media.storagePath, uploadedBy: media.uploadedBy })
    .from(media)
    .where(eq(media.id, id))
    .limit(1);

  if (!row) return { error: "File not found." };

  if (row.uploadedBy !== session.userId && session.role !== "admin") {
    return { error: "Permission denied." };
  }

  // Delete from Supabase Storage first
  const supabase = await createSupabaseServer();
  const { error: storageError } = await supabase.storage
    .from(BUCKET)
    .remove([row.storagePath]);

  if (storageError) return { error: storageError.message };

  // Delete DB row
  await db.delete(media).where(eq(media.id, id));

  revalidatePath("/cms/media");
  return {};
}
