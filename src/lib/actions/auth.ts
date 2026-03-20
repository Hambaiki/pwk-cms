"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { profiles } from "@/lib/db/schema";

// ─── Schemas ───────────────────────────────────────────────────────────────────

const SignupSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address." }),
  password: z
    .string()
    .min(8, { message: "Password must be at least 8 characters." })
    .regex(/[A-Z]/, { message: "Must contain at least one uppercase letter." })
    .regex(/[0-9]/, { message: "Must contain at least one number." }),
  displayName: z
    .string()
    .min(2, { message: "Name must be at least 2 characters." })
    .trim(),
});

const LoginSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address." }),
  password: z.string().min(1, { message: "Password is required." }),
});

// ─── Types ─────────────────────────────────────────────────────────────────────

export type AuthState =
  | {
      errors?: {
        email?: string[];
        password?: string[];
        displayName?: string[];
        general?: string[];
      };
      message?: string;
    }
  | undefined;

// ─── Sign Up ───────────────────────────────────────────────────────────────────

export async function signup(
  state: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const validated = SignupSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    displayName: formData.get("displayName"),
  });

  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors };
  }

  const { email, password, displayName } = validated.data;
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { display_name: displayName } },
  });

  if (error) {
    return { errors: { general: [error.message] } };
  }

  // Insert profile row — no role column in the new schema
  if (data.user) {
    await db
      .insert(profiles)
      .values({ id: data.user.id, displayName, email })
      .onConflictDoNothing();
  }

  revalidatePath("/", "layout");
  redirect("/check-email");
}

// ─── Log In ────────────────────────────────────────────────────────────────────

export async function login(
  state: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const validated = LoginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors };
  }

  const { email, password } = validated.data;
  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return {
      errors: {
        general: [
          error.message === "Invalid login credentials"
            ? "Invalid email or password. Please try again."
            : error.message,
        ],
      },
    };
  }

  revalidatePath("/", "layout");
  redirect("/cms"); // redirect to CMS dashboard, not /dashboard
}

// ─── Log Out ───────────────────────────────────────────────────────────────────

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}
