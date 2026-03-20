import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import {
  getEntriesByCollection,
  getOrCreatePageEntry,
} from "@/lib/actions/entries";
import { NewEntryButton } from "@/components/editor/NewEntryButton";

type Props = { params: Promise<{ collection: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { collection: collectionSlug } = await params;
  return { title: `${collectionSlug} — pwk-cms` };
}

const statusStyle = {
  draft: "bg-[rgba(90,88,85,0.15)] border-[rgba(90,88,85,0.3)] text-cms-text-3",
  published:
    "bg-[rgba(40,160,90,0.1)] border-[rgba(40,160,90,0.25)] text-[#50c878]",
  archived:
    "bg-[rgba(224,80,80,0.08)] border-cms-danger-border text-cms-danger",
} as const;

export default async function EntriesPage({ params }: Props) {
  const { collection: collectionSlug } = await params;
  const result = await getEntriesByCollection(collectionSlug);
  if (!result) notFound();

  const { collection, entries } = result;

  // Page collections have exactly one entry — go straight to the editor
  if (collection.isPage) {
    const entryId = await getOrCreatePageEntry(collection.id);
    redirect(`/cms/editor/${entryId}`);
  }

  return (
    <div className="p-8 mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-7">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{collection.icon ?? "📄"}</span>
          <div>
            <h1 className="text-lg font-medium text-cms-text leading-tight">
              {collection.name}
            </h1>
            <code className="font-mono text-[11px] text-cms-text-3">
              /api/v1/{collection.slug}
            </code>
          </div>
        </div>
        <NewEntryButton collectionId={collection.id} />
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
            className="grid gap-3 px-3.5 py-1.5 font-mono text-[10px] tracking-[0.07em] uppercase text-cms-text-3"
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

              <span
                className={`font-mono text-[10px] px-1.5 py-0.5 rounded border w-fit ${statusStyle[entry.status]}`}
              >
                {entry.status}
              </span>

              <div className="flex flex-wrap gap-1 min-w-0">
                {entry.tags.length > 0 ? (
                  entry.tags.map((tag) => (
                    <span
                      key={tag.id}
                      className="font-mono text-[10px] px-1.5 py-0.5 rounded-full border border-[rgba(232,160,48,0.25)] bg-cms-accent-subtle text-cms-accent"
                    >
                      {tag.name}
                    </span>
                  ))
                ) : (
                  <span className="font-mono text-[10px] text-cms-text-3">
                    —
                  </span>
                )}
              </div>

              <span className="font-mono text-[11px] text-cms-text-3">
                {new Date(entry.updatedAt).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>

              <div className="flex justify-end">
                <Link
                  href={`/cms/editor/${entry.id}`}
                  className="font-mono text-[11px] text-cms-accent px-2.5 py-1 rounded-cms border border-cms-accent-border bg-cms-accent-subtle hover:bg-cms-accent-dim transition-colors no-underline"
                >
                  Edit
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
