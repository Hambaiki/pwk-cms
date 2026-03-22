import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/dal";
import { notFound } from "next/navigation";
import Link from "next/link";

export const metadata: Metadata = { title: "Settings — pwk-cms" };

export default async function SettingsPage() {
  const profile = await getCurrentUser();
  if (!profile) notFound();

  return (
    <div className="p-8 mx-auto space-y-8">
      <div>
        <h1 className="text-lg font-medium text-cms-text">Account settings</h1>
        <p className="font-mono text-xs text-cms-text-3 mt-1">
          Manage your account settings and preferences.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Link
          href="/cms/profile"
          className="rounded-cms-lg border border-cms-border bg-cms-surface p-4 hover:border-cms-accent hover:bg-cms-surface-2 transition"
        >
          <p className="font-mono text-xs font-medium text-cms-text">Profile</p>
          <p className="text-xs text-cms-text-3 mt-1">Edit display name, avatar, and email.</p>
        </Link>

        <div className="rounded-cms-lg border border-cms-border bg-cms-surface p-4">
          <p className="font-mono text-xs font-medium text-cms-text">Security</p>
          <p className="text-xs text-cms-text-3 mt-1">
            Your password and auth are managed by Supabase. Use the login page to reset credentials.
          </p>
        </div>
      </div>

      <section className="rounded-cms-lg border border-cms-border bg-cms-surface p-4">
        <p className="font-mono text-xs text-cms-text-3">
          Signed in as <span className="text-cms-text">{profile.email}</span>
        </p>
      </section>
    </div>
  );
}
