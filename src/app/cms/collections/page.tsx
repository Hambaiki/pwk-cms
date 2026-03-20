import Link from "next/link";
import type { Metadata } from "next";
import { getCollections } from "@/lib/actions/collections";

export const metadata: Metadata = { title: "Collections — pwk-cms" };

export default async function CollectionsPage() {
  const collections = await getCollections();

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-xl font-medium text-stone-100 tracking-tight">
            Collections
          </h1>
          <p className="text-sm text-stone-500 mt-1">
            Define your content types and their fields.
          </p>
        </div>
        <Link
          href="/cms/collections/new"
          className="inline-flex items-center gap-2 rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-stone-950 hover:bg-amber-400 transition-colors"
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

      {collections.length === 0 ? (
        <div className="rounded-xl border border-stone-800 border-dashed bg-stone-900/40 px-6 py-16 text-center">
          <p className="text-sm text-stone-500">No collections yet.</p>
          <p className="text-xs text-stone-600 mt-1">
            Create one to start defining your content structure.
          </p>
        </div>
      ) : (
        <div className="grid gap-3">
          {collections.map((col) => (
            <Link
              key={col.id}
              href={`/cms/collections/${col.id}`}
              className="group flex items-center gap-4 rounded-xl border border-stone-800 bg-stone-900/60 px-5 py-4 hover:border-stone-600 hover:bg-stone-900 transition-all"
            >
              <span
                className="text-xl w-8 text-center select-none"
                aria-hidden="true"
              >
                {col.icon ?? "📄"}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-stone-100">
                    {col.name}
                  </span>
                  {col.isPage && (
                    <span className="rounded-full bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 text-xs text-purple-400">
                      page
                    </span>
                  )}
                </div>
                <span className="text-xs text-stone-500 font-mono">
                  /api/v1/{col.slug}
                </span>
              </div>
              <svg
                viewBox="0 0 16 16"
                fill="none"
                className="w-4 h-4 text-stone-600 group-hover:text-stone-400 transition-colors shrink-0"
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
