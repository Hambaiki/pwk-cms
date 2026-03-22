import Link from "next/link";
import type { Metadata } from "next";
import { getCollections, getCollectionStats } from "@/lib/actions/collections";
import { Book, List, Plus, Wrench } from "lucide-react";

export const metadata: Metadata = { title: "Collections — pwk-cms" };

export default async function CollectionsPage() {
  const collections = await getCollections();

  // Fetch stats for each collection
  const collectionsWithStats = await Promise.all(
    collections.map(async (col) => ({
      ...col,
      stats: await getCollectionStats(col.id),
    })),
  );

  return (
    <div className="p-8 mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-xl font-medium text-cms-text tracking-tight">
            Collections
          </h1>
          <p className="text-sm text-cms-text-2 mt-1">
            Define your content types and their fields.
          </p>
        </div>

        <Link
          href="/cms/collections/new"
          className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all duration-200
                     bg-cms-accent text-cms-accent-text
                     hover:brightness-110 active:scale-[0.98]"
        >
          <Plus size={16} />
          New collection
        </Link>
      </div>

      {/* Empty state */}
      {collectionsWithStats.length === 0 ? (
        <div className="rounded-xl border border-dashed border-cms-border bg-cms-surface/40 px-6 py-16 text-center">
          <p className="text-sm text-cms-text-2">No collections yet.</p>
          <p className="text-xs text-cms-text-3 mt-1">
            Create one to start defining your content structure.
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {collectionsWithStats.map((col) => {
            const canEdit = col.role === "owner" || col.role === "editor";
            return (
              <div
                key={col.id}
                className="rounded-xl border border-cms-border bg-cms-surface/60 p-5 transition-all duration-200
                           hover:border-cms-border-2 hover:bg-cms-surface"
              >
                {/* Main link area */}
                <Link
                  href={`/cms/collections/${col.id}`}
                  className="flex items-center gap-4 mb-4 no-underline"
                >
                  {/* Icon */}
                  <span
                    className="text-xl w-8 text-center select-none"
                    aria-hidden="true"
                  >
                    {col.icon ?? "📄"}
                  </span>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-cms-text">
                        {col.name}
                      </span>

                      {/* Page badge */}
                      {col.isPage && (
                        <span className="rounded-full bg-cms-accent-subtle border border-cms-accent-border px-2 py-0.5 text-xs text-cms-accent">
                          page
                        </span>
                      )}
                    </div>

                    <span className="text-xs text-cms-text-3 font-mono">
                      /api/v1/{col.slug}
                    </span>
                  </div>

                  {/* Arrow */}
                  <svg
                    viewBox="0 0 16 16"
                    fill="none"
                    className="w-4 h-4 text-cms-text-3 transition-colors shrink-0"
                    aria-hidden="true"
                  >
                    <path
                      d="M6 3l5 5-5 5"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </Link>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className="text-center bg-cms-surface-2 rounded-lg p-2">
                    <div className="font-mono text-lg font-medium text-cms-accent">
                      {col.stats.totalEntries}
                    </div>
                    <div className="font-mono text-xs text-cms-text-3 uppercase tracking-wide">
                      Entries
                    </div>
                  </div>
                  <div className="text-center bg-cms-surface-2 rounded-lg p-2">
                    <div className="font-mono text-lg font-medium text-cms-accent">
                      {col.stats.publishedEntries}
                    </div>
                    <div className="font-mono text-xs text-cms-text-3 uppercase tracking-wide">
                      Published
                    </div>
                  </div>
                  <div className="text-center bg-cms-surface-2 rounded-lg p-2">
                    <div className="font-mono text-lg font-medium text-cms-accent">
                      {col.stats.totalMedia}
                    </div>
                    <div className="font-mono text-xs text-cms-text-3 uppercase tracking-wide">
                      Media
                    </div>
                  </div>
                </div>

                {/* Quick actions */}
                <div className="flex items-center gap-2 flex-wrap">
                  <Link
                    href={`/cms/collections/${col.id}/entries`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-cms border border-cms-border bg-transparent text-cms-text-2 font-mono text-xs hover:border-cms-border-2 transition-colors no-underline"
                  >
                    <Book size={16} />
                    Entries
                  </Link>
                  {canEdit && (
                    <>
                      <Link
                        href={`/cms/collections/${col.id}/schema`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-cms border border-cms-border bg-transparent text-cms-text-2 font-mono text-xs hover:border-cms-border-2 transition-colors no-underline"
                      >
                        <List size={16} />
                        Schema
                      </Link>
                      <Link
                        href={`/cms/collections/${col.id}/settings`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-cms border border-cms-border bg-transparent text-cms-text-2 font-mono text-xs hover:border-cms-border-2 transition-colors no-underline"
                      >
                        <Wrench size={16} />
                        Settings
                      </Link>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
