import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { getCollectionById } from "@/lib/actions/collections";
import { CollectionForm } from "@/components/collections/CollectionForm";
import { Cable, List, Tag, Users } from "lucide-react";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const result = await getCollectionById(id);
  return {
    title: result
      ? `Settings — ${result.collection.name} — pwk-cms`
      : "Not found",
  };
}

const SettingCard = ({
  href,
  label,
  description,
  icon,
}: {
  href: string;
  label: string;
  description: string;
  icon: React.ReactNode;
}) => (
  <Link
    href={href}
    className="flex items-center gap-4 px-5 py-4 rounded-cms-lg border border-cms-border bg-cms-surface hover:border-cms-border-2 hover:bg-cms-surface-2 transition-colors no-underline"
  >
    <div className="text-cms-text-3 shrink-0">{icon}</div>
    <div className="flex-1 min-w-0">
      <p className="font-mono text-xs font-medium text-cms-text">{label}</p>
      <p className="font-mono text-sm text-cms-text-3 mt-0.5">{description}</p>
    </div>
    <svg
      viewBox="0 0 16 16"
      fill="none"
      width="14"
      height="14"
      className="text-cms-text-3 shrink-0"
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
);

export default async function SettingsPage({ params }: Props) {
  const { id } = await params;
  const result = await getCollectionById(id);
  if (!result) notFound();

  const { collection, role } = result;
  const isOwner = role === "owner";

  return (
    <div className="p-8 mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-lg font-medium text-cms-text">
          Settings{collection.name ? ` — ${collection.name}` : ""}
        </h1>
        <p className="font-mono text-sm text-cms-text-3 mt-0.5">
          Manage schema, members, and API keys.
        </p>
      </div>

      {/* Settings grid */}
      <div className="grid gap-4 sm:grid-cols-2">
        <SettingCard
          href={`/cms/collections/${id}/settings/schema`}
          label="Schema"
          description="Define fields and content structure."
          icon={<List />}
        />

        <SettingCard
          href={`/cms/collections/${id}/settings/tags`}
          label="Tags"
          description="Create and manage tags for entries."
          icon={<Tag />}
        />

        {isOwner && (
          <>
            <SettingCard
              href={`/cms/collections/${id}/settings/members`}
              label="Members"
              description="Manage who has access to this collection."
              icon={<Users />}
            />

            <SettingCard
              href={`/cms/collections/${id}/settings/api-keys`}
              label="API Keys"
              description="Create and manage API keys for this collection."
              icon={<Cable />}
            />
          </>
        )}
      </div>

      {isOwner && (
        <div className="space-y-3">
          <p className="font-mono text-xs tracking-widest uppercase text-cms-text-3">
            Settings
          </p>
          <div className="rounded-cms-lg border border-cms-border bg-cms-surface p-6">
            <CollectionForm mode="edit" collection={collection} />
          </div>
        </div>
      )}
    </div>
  );
}
