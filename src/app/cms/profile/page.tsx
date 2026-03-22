import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/dal";
import { notFound } from "next/navigation";
import { ProfileForm } from "@/components/settings/ProfileForm";

export const metadata: Metadata = { title: "Profile — pwk-cms" };

export default async function ProfilePage() {
  const profile = await getCurrentUser();
  if (!profile) notFound();

  return (
    <div className="p-8 mx-auto space-y-6">
      <div className="flex items-start gap-3">
        <h1 className="text-lg font-medium text-cms-text">Your profile</h1>
      </div>

      <div className="rounded-cms-lg border border-cms-border bg-cms-surface p-6">
        <ProfileForm
          displayName={profile.displayName ?? ""}
          email={profile.email}
          avatarUrl={profile.avatarUrl ?? undefined}
        />
      </div>
    </div>
  );
}
