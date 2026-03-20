import Link from "next/link";
import type { Metadata } from "next";
import { getCollections } from "@/lib/actions/collections";

export const metadata: Metadata = { title: "Collections — pwk-cms" };

export default async function CollectionsPage() {
  const collections = await getCollections();

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
          <svg
            viewBox="0 0 16 16"
            fill="none"
            className="w-4 h-4"
            aria-hidden="true"
          >
            <path
              d="M8 3v10M3 8h10"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
          New collection
        </Link>
      </div>

      {/* Empty state */}
      {collections.length === 0 ? (
        <div className="rounded-xl border border-dashed border-cms-border bg-cms-surface/40 px-6 py-16 text-center">
          <p className="text-sm text-cms-text-2">No collections yet.</p>
          <p className="text-xs text-cms-text-3 mt-1">
            Create one to start defining your content structure.
          </p>
        </div>
      ) : (
        <div className="grid gap-3">
          {collections.map((col) => (
            <Link
              key={col.id}
              href={`/cms/collections/${col.id}`}
              className="group flex items-center gap-4 rounded-xl border border-cms-border bg-cms-surface/60 px-5 py-4 transition-all duration-200
                         hover:border-cms-border-2 hover:bg-cms-surface"
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
                className="w-4 h-4 text-cms-text-3 group-hover:text-cms-text-2 transition-colors shrink-0"
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
          ))}
        </div>
      )}
    </div>
  );
}
