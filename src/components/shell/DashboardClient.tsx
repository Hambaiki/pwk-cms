"use client";

import Link from "next/link";
import type { Collection, Profile } from "@/lib/db/schema";

type Props = {
  user: Pick<Profile, "displayName" | "email"> | null;
  collections: Collection[];
  greeting: string;
  today: string;
};

export function DashboardClient({ user, collections, greeting, today }: Props) {
  const stats = [
    {
      label: "Collections",
      value: collections.length,
      href: "/cms/collections",
    },
    { label: "Total fields", value: "—", href: "/cms/collections" },
    { label: "API keys", value: "—", href: "/cms/settings/api-keys" },
  ];

  return (
    <div className="p-8 max-w-5xl mx-auto">
      {/* Welcome */}
      <p className="font-serif italic text-3xl text-cms-text leading-tight">
        {greeting}
        {user?.displayName ? `, ${user.displayName}` : ""}.
      </p>
      <p className="font-mono text-xs text-cms-text3 mt-2">{today}</p>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mt-10">
        {stats.map(({ label, value, href }) => (
          <Link
            key={label}
            href={href}
            className="block p-5 rounded-cms-lg border border-cms-border bg-cms-surface hover:border-cms-border2 transition-colors duration-150 no-underline"
          >
            <div className="font-mono text-2xl font-medium text-cms-accent leading-none">
              {value}
            </div>
            <div className="font-mono text-[10px] tracking-widest uppercase text-cms-text3 mt-1.5">
              {label}
            </div>
          </Link>
        ))}
      </div>

      {/* Collections quick-access */}
      {collections.length > 0 && (
        <div className="mt-10">
          <p className="font-mono text-[10px] tracking-widest uppercase text-cms-text3 mb-3">
            Collections
          </p>
          <div className="flex flex-col gap-1">
            {collections.map((col) => (
              <Link
                key={col.id}
                href={`/cms/entries/${col.slug}`}
                className="flex items-center gap-3 px-4 py-2.5 rounded-cms border border-cms-border bg-cms-surface hover:border-cms-border2 hover:bg-cms-surface2 transition-colors duration-150 no-underline"
              >
                <span className="text-sm w-5 text-center shrink-0">
                  {col.icon ?? "📄"}
                </span>
                <span className="flex-1 text-sm text-cms-text">{col.name}</span>
                <code className="font-mono text-[11px] text-cms-text3">
                  /api/v1/{col.slug}
                </code>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {collections.length === 0 && (
        <div className="mt-10 rounded-cms-lg border border-dashed border-cms-border px-6 py-10 text-center">
          <p className="text-sm text-cms-text2 mb-3">No collections yet.</p>
          <Link
            href="/cms/collections/new"
            className="inline-block px-4 py-2 rounded-cms bg-cms-accent text-cms-accent-text
                       font-mono text-xs font-medium no-underline hover:opacity-90 transition-opacity"
          >
            Create your first collection
          </Link>
        </div>
      )}
    </div>
  );
}
