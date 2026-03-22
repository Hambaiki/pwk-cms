import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { getCollectionById } from "@/lib/actions/collections";
import { SchemaBuilder } from "@/components/collections/SchemaBuilder";
import { cn } from "@/lib/utils";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const result = await getCollectionById(id);
  return {
    title: result
      ? `Schema — ${result.collection.name} — pwk-cms`
      : "Not found",
  };
}

export default async function SchemaPage({ params }: Props) {
  const { id } = await params;
  const result = await getCollectionById(id);
  if (!result) notFound();

  const { collection, fields, role } = result;
  const isOwner = role === "owner";

  return (
    <div className="p-8 mx-auto">
      {/* Breadcrumb back */}
      <Link
        href={`/cms/collections/${id}/settings`}
        className="inline-flex items-center gap-1.5 font-mono text-sm text-cms-text-3 hover:text-cms-text-2 transition-colors no-underline mb-6"
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

      <div className="flex items-center gap-3 mb-8">
        <span className="text-2xl">{collection.icon ?? "📄"}</span>
        <div>
          <h1 className="text-lg font-medium text-cms-text">Schema</h1>
          <p className="font-mono text-sm text-cms-text-3 mt-0.5">
            Define fields and their types for {collection.name}.
          </p>
        </div>
      </div>

      {isOwner ? (
        <SchemaBuilder collectionId={collection.id} initialFields={fields} />
      ) : (
        <div className="rounded-cms-lg border border-cms-border bg-cms-surface p-6 text-center">
          <p className="font-mono text-sm text-cms-text-3">
            Only owners can modify the schema.
          </p>
        </div>
      )}
    </div>
  );
}
