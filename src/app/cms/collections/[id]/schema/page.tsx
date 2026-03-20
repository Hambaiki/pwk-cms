import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { getCollectionById } from "@/lib/actions/collections";
import { SchemaBuilder } from "@/components/collections/SchemaBuilder";

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
        href={`/cms/collections/${id}`}
        className="inline-flex items-center gap-1.5 font-mono text-[11px] text-cms-text-3 hover:text-cms-text-2 transition-colors no-underline mb-6"
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
        {collection.name}
      </Link>

      <div className="flex items-center gap-3 mb-8">
        <span className="text-2xl">{collection.icon ?? "📄"}</span>
        <div>
          <h1 className="text-lg font-medium text-cms-text">Schema</h1>
          <p className="font-mono text-[11px] text-cms-text-3">
            Define the fields for {collection.name}
          </p>
        </div>
      </div>

      {isOwner ? (
        <SchemaBuilder collectionId={collection.id} initialFields={fields} />
      ) : (
        <div className="rounded-cms-lg border border-cms-border bg-cms-surface p-5">
          {fields.length === 0 ? (
            <p className="font-mono text-xs text-cms-text-3">
              No fields defined yet.
            </p>
          ) : (
            <div className="flex flex-col gap-0.5">
              <div
                className="grid gap-3 px-3.5 py-1.5 font-mono text-[10px] tracking-[0.07em] uppercase text-cms-text-3"
                style={{ gridTemplateColumns: "1fr 100px 60px 60px" }}
              >
                <span>Name</span>
                <span>Type</span>
                <span>Required</span>
                <span>Multiple</span>
              </div>
              {fields.map((f) => (
                <div
                  key={f.id}
                  className="grid items-center gap-3 px-3.5 py-2 rounded-cms border border-cms-border bg-cms-surface"
                  style={{ gridTemplateColumns: "1fr 100px 60px 60px" }}
                >
                  <div>
                    <span className="font-mono text-xs text-cms-text">
                      {f.name}
                    </span>
                    <code className="font-mono text-[10px] text-cms-text-3 ml-2">
                      {f.slug}
                    </code>
                  </div>
                  <span className="font-mono text-[11px] text-cms-text-3">
                    {f.type}
                  </span>
                  <span
                    className={`font-mono text-[10px] ${f.required ? "text-cms-danger" : "text-cms-text-3"}`}
                  >
                    {f.required ? "yes" : "—"}
                  </span>
                  <span
                    className={`font-mono text-[10px] ${f.multiple ? "text-cms-accent" : "text-cms-text-3"}`}
                  >
                    {f.multiple ? "yes" : "—"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
