import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { getCollectionById } from "@/lib/actions/collections";
import { CollectionForm } from "@/components/collections/CollectionForm";
import { SchemaBuilder } from "@/components/collections/SchemaBuilder";
import { DeleteCollectionButton } from "@/components/collections/DeleteCollectionButton";
import { NewEntryButton } from "@/components/editor/NewEntryButton";
import { EditPageButton } from "@/components/editor/EditPageButton";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const result = await getCollectionById(id);
  return {
    title: result ? `${result.collection.name} — pwk-cms` : "Not found",
  };
}

export default async function CollectionDetailPage({ params }: Props) {
  const { id } = await params;
  const result = await getCollectionById(id);
  if (!result) notFound();

  const { collection, fields } = result;

  return (
    <div className="p-8 max-w-3xl space-y-10 mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="text-2xl select-none" aria-hidden="true">
            {collection.icon ?? "📄"}
          </span>
          <div>
            <h1 className="text-lg font-medium text-cms-text leading-tight">
              {collection.name}
            </h1>
            <code className="font-mono text-[11px] text-cms-text3">
              /api/v1/{collection.slug}
            </code>
          </div>
        </div>
        <DeleteCollectionButton
          collectionId={collection.id}
          collectionName={collection.name}
        />
      </div>

      {/* Content shortcut */}
      <div className="flex items-center justify-between gap-4 px-5 py-4 rounded-cms-lg border border-cms-border bg-cms-surface">
        <div>
          {collection.isPage ? (
            <>
              <p className="text-sm font-medium text-cms-text">Single page</p>
              <p className="font-mono text-[11px] text-cms-text3 mt-0.5">
                This collection has exactly one entry — edit it directly.
              </p>
            </>
          ) : (
            <>
              <p className="text-sm font-medium text-cms-text">
                Content entries
              </p>
              <p className="font-mono text-[11px] text-cms-text3 mt-0.5">
                View and manage all entries in this collection.
              </p>
            </>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {collection.isPage ? (
            <EditPageButton collectionId={collection.id} />
          ) : (
            <>
              <Link
                href={`/cms/entries/${collection.slug}`}
                className="px-3 py-1.5 rounded-cms border border-cms-border bg-transparent text-cms-text2 font-mono text-xs hover:border-cms-border2 transition-colors no-underline"
              >
                View entries
              </Link>
              <NewEntryButton collectionId={collection.id} />
            </>
          )}
        </div>
      </div>

      {/* Settings */}
      <section>
        <h2 className="font-mono text-[10px] tracking-[0.1em] uppercase text-cms-text3 mb-4">
          Settings
        </h2>
        <div className="rounded-cms-lg border border-cms-border bg-cms-surface p-6">
          <CollectionForm mode="edit" collection={collection} />
        </div>
      </section>

      {/* Schema builder */}
      <section>
        <h2 className="font-mono text-[10px] tracking-[0.1em] uppercase text-cms-text3 mb-4">
          Fields
        </h2>
        <SchemaBuilder collectionId={collection.id} initialFields={fields} />
      </section>
    </div>
  );
}
