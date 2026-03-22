import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { getCollectionById } from "@/lib/actions/collections";
import { getCollectionMembers } from "@/lib/actions/members";
import { MembersClient } from "@/components/members/MembersClient";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const result = await getCollectionById(id);
  return {
    title: result
      ? `Members — ${result.collection.name} — pwk-cms`
      : "Not found",
  };
}

export default async function MembersPage({ params }: Props) {
  const { id } = await params;
  const result = await getCollectionById(id);
  if (!result) notFound();

  const { collection, role } = result;
  if (role !== "owner") notFound();

  const members = await getCollectionMembers(id);

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
          <h1 className="text-lg font-medium text-cms-text">Members</h1>
          <p className="font-mono text-sm text-cms-text-3">
            Manage who has access to {collection.name}.
          </p>
        </div>
      </div>

      <MembersClient collectionId={collection.id} initialMembers={members} />
    </div>
  );
}
