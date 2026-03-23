import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import {
  getEntriesByCollection,
  getOrCreatePageEntry,
} from "@/lib/actions/entries";
import { getCollectionById } from "@/lib/actions/collections";
import { NewEntryButton } from "@/components/editor/NewEntryButton";
import { StatusBadge } from "@/components/entry/StatusBadge";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return { title: `Entries — pwk-cms` };
}

export default async function EntriesPage({ params }: Props) {
  const { id } = await params;

  // First, get the collection to get its slug
  const collectionResult = await getCollectionById(id);
  if (!collectionResult) notFound();

  const { collection: col } = collectionResult;

  // Then fetch entries using the slug
  const result = await getEntriesByCollection(col.slug);
  if (!result) notFound();

  const { entries } = result;

  // Page collections have exactly one entry — go straight to the editor
  if (col.isPage) {
    const entryId = await getOrCreatePageEntry(col.id);
    redirect(`/cms/collections/${col.id}/entries/${entryId}`);
  }

  return (
    <div className="p-8 mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-7">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{col.icon ?? "📄"}</span>
          <div>
            <h1 className="text-lg font-medium text-cms-text leading-tight">
              {col.name}
            </h1>
            <code className="font-mono text-sm text-cms-text-3">
              /api/v1/{col.slug}
            </code>
          </div>
        </div>
        <NewEntryButton collectionId={col.id} />
      </div>

      {entries.length === 0 ? (
        <div className="rounded-cms-lg border border-dashed border-cms-border px-6 py-12 text-center">
          <p className="font-mono text-xs text-cms-text-3">
            No entries yet — create your first one above.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-0.5">
          {/* Column headers */}
          <div
            className="grid gap-3 px-3.5 py-1.5 font-mono text-xs tracking-[0.07em] uppercase text-cms-text-3"
            style={{ gridTemplateColumns: "1fr 100px 1fr 120px 60px" }}
          >
            <span>Slug</span>
            <span>Status</span>
            <span>Tags</span>
            <span>Updated</span>
            <span />
          </div>

          {entries.map((entry) => (
            <div
              key={entry.id}
              className="grid items-center gap-3 px-3.5 py-2.5 rounded-cms border border-cms-border bg-cms-surface"
              style={{ gridTemplateColumns: "1fr 100px 1fr 120px 60px" }}
            >
              <code className="font-mono text-xs text-cms-text-2 overflow-hidden text-ellipsis whitespace-nowrap">
                {entry.slug}
              </code>

              <StatusBadge variant={entry.status} />

              <div className="flex flex-wrap gap-1 min-w-0">
                {entry.tags.length > 0 ? (
                  entry.tags.map((tag) => (
                    <span
                      key={tag.id}
                      className="font-mono text-xs px-1.5 py-0.5 rounded-full border border-[rgba(232,160,48,0.25)] bg-cms-accent-subtle text-cms-accent"
                    >
                      {tag.name}
                    </span>
                  ))
                ) : (
                  <span className="font-mono text-xs text-cms-text-3">—</span>
                )}
              </div>

              <span className="font-mono text-sm text-cms-text-3">
                {new Date(entry.updatedAt).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>

              <Link
                href={`/cms/collections/${col.id}/entries/${entry.id}`}
                className="px-2.5 py-1.5 rounded-cms border border-cms-border bg-transparent text-cms-text-2 font-mono text-xs hover:border-cms-accent transition-colors no-underline text-center"
              >
                Edit
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
