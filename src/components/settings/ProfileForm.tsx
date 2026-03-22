"use client";

import { useState } from "react";
import { updateProfile } from "@/lib/actions/profile";
import { cn } from "@/lib/utils";

type Props = {
  displayName: string;
  email: string;
  avatarUrl?: string | null;
};

export function ProfileForm({ displayName, email, avatarUrl }: Props) {
  const [name, setName] = useState(displayName || "");
  const [avatar, setAvatar] = useState(avatarUrl ?? "");
  const [status, setStatus] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setStatus(null);

    try {
      await updateProfile({ displayName: name, avatarUrl: avatar });
      setStatus("Saved");
    } catch (error) {
      setStatus("Failed to save profile. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="block text-xs font-mono text-cms-text-3 mb-1">Email (read only)</label>
          <input
            value={email}
            readOnly
            className="w-full rounded-cms border border-cms-border bg-cms-surface-2 px-3 py-2 font-mono text-sm text-cms-text outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-mono text-cms-text-3 mb-1">Display name</label>
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="w-full rounded-cms border border-cms-border bg-cms-surface-2 px-3 py-2 font-mono text-sm text-cms-text outline-none"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-mono text-cms-text-3 mb-1">Avatar URL</label>
        <input
          value={avatar}
          onChange={(event) => setAvatar(event.target.value)}
          placeholder="https://..."
          className="w-full rounded-cms border border-cms-border bg-cms-surface-2 px-3 py-2 font-mono text-sm text-cms-text outline-none"
        />
      </div>

      <button
        type="submit"
        disabled={saving}
        className={cn(
          "rounded-cms border px-4 py-2 font-mono text-xs font-medium transition",
          saving
            ? "bg-cms-border text-cms-text-3 cursor-not-allowed"
            : "bg-cms-accent text-cms-accent-text hover:opacity-90",
        )}
      >
        {saving ? "Saving…" : "Save profile"}
      </button>

      {status && <p className="font-mono text-xs text-cms-text-3">{status}</p>}
    </form>
  );
}
