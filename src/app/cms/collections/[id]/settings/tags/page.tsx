import type { Metadata } from "next";
import Link from "next/link";
import { getTags } from "@/lib/actions/tags";
import { getCollectionById } from "@/lib/actions/collections";
import { TagsClient } from "@/components/tags/TagsClient";
import { notFound } from "next/navigation";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const result = await getCollectionById(id);
  return {
    title: result ? `Tags — ${result.collection.name} — pwk-cms` : "Not found",
  };
}

export default async function TagsPage({ params }: Props) {
  const { id } = await params;
  const result = await getCollectionById(id);
  if (!result) notFound();

  const { collection } = result;
  const allTags = await getTags(id);

  return (
    <div className="p-8 mx-auto space-y-8">
      {/* Breadcrumb back */}
      <Link
        href={`/cms/collections/${id}/settings`}
        className="inline-flex items-center gap-1.5 font-mono text-sm text-cms-text-3 hover:text-cms-text-2 transition-colors no-underline"
      >
        <svg viewBox="0 0 14 14" fill="none" width="12" height="12">
          <path
            d="M9 3L5 7l4 4"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        Settings
      </Link>

      <div className="flex items-center gap-3">
        <span className="text-2xl">{collection.icon ?? "📄"}</span>
        <div>
          <h1 className="text-lg font-medium text-cms-text">Tags</h1>
          <p className="font-mono text-sm text-cms-text-3 mt-0.5">
            Create and manage tags for {collection.name} entries.
          </p>
        </div>
      </div>

      <TagsClient collectionId={collection.id} initialTags={allTags} />
    </div>
  );
}
