"use server";

import { db } from "@/lib/db";
import { profiles } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { verifySession } from "@/lib/dal";

export async function updateProfile(data: {
  displayName: string;
  avatarUrl?: string;
}) {
  const session = await verifySession();

  await db
    .update(profiles)
    .set({
      displayName: data.displayName,
      avatarUrl: data.avatarUrl || null,
      updatedAt: new Date(),
    })
    .where(eq(profiles.id, session.userId));

  revalidatePath("/cms/profile");
  revalidatePath("/cms/settings");
  revalidatePath("/cms");
}
