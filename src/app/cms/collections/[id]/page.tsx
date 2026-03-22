import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import {
  getCollectionById,
  getCollectionStats,
} from "@/lib/actions/collections";
import { getEntriesByCollection } from "@/lib/actions/entries";
import { DeleteCollectionButton } from "@/components/collections/DeleteCollectionButton";
import { CollectionForm } from "@/components/collections/CollectionForm";
import { NewEntryButton } from "@/components/editor/NewEntryButton";
import { EditPageButton } from "@/components/editor/EditPageButton";
import { RoleBadge } from "@/components/members/RoleBadge";
import { Book, Image, Wrench } from "lucide-react";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const result = await getCollectionById(id);
  return {
    title: result ? `${result.collection.name} — pwk-cms` : "Not found",
  };
}

function SubPageCard({
  href,
  label,
  description,
  icon,
}: {
  href: string;
  label: string;
  description: string;
  icon: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-4 px-5 py-4 rounded-cms-lg border border-cms-border bg-cms-surface hover:border-cms-border-2 hover:bg-cms-surface-2 transition-colors no-underline"
    >
      <div className="text-cms-text-3 shrink-0">{icon}</div>
      <div className="flex-1 min-w-0">
        <p className="font-mono text-xs font-medium text-cms-text">{label}</p>
        <p className="font-mono text-sm text-cms-text-3 mt-0.5">
          {description}
        </p>
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
}

export default async function CollectionOverviewPage({ params }: Props) {
  const { id } = await params;
  const result = await getCollectionById(id);
  if (!result) notFound();

  const { collection, fields, role } = result;
  const isOwner = role === "owner";
  const canEdit = role === "owner" || role === "editor";

  const stats = await getCollectionStats(id);
  const entriesResult = await getEntriesByCollection(collection.slug);
  const recentEntries = entriesResult?.entries.slice(0, 5) ?? [];

  return (
    <div className="p-8 mx-auto space-y-8">
      {/* ── Header ───────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="text-3xl select-none" aria-hidden="true">
            {collection.icon ?? "📄"}
          </span>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg font-medium text-cms-text leading-tight">
                {collection.name}
              </h1>
              <RoleBadge variant={role} />
              {collection.isPage && (
                <span className="font-mono text-xxs px-1.5 py-px rounded bg-[rgba(130,90,220,0.15)] border border-[rgba(130,90,220,0.25)] text-[#a080e8]">
                  page
                </span>
              )}
            </div>
            <code className="font-mono text-sm text-cms-text-3">
              /api/v1/{collection.slug}
            </code>
            {collection.description && (
              <p className="font-mono text-sm text-cms-text-3 mt-0.5">
                {collection.description}
              </p>
            )}
          </div>
        </div>
        {isOwner && (
          <DeleteCollectionButton
            collectionId={collection.id}
            collectionName={collection.name}
          />
        )}
      </div>

      {/* ── Stats ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {[
          { label: "Total entries", value: stats.totalEntries },
          { label: "Published", value: stats.publishedEntries },
          { label: "Draft", value: stats.draftEntries },
          { label: "Media files", value: stats.totalMedia },
          { label: "Team members", value: stats.totalMembers },
          { label: "API keys", value: stats.totalApiKeys },
        ].map(({ label, value }) => (
          <div
            key={label}
            className="px-4 py-3 rounded-cms-lg border border-cms-border bg-cms-surface"
          >
            <div className="font-mono text-xl font-medium text-cms-accent leading-none">
              {value}
            </div>
            <div className="font-mono text-xs tracking-widest uppercase text-cms-text-3 mt-1">
              {label}
            </div>
          </div>
        ))}
      </div>

      {/* ── Quick actions ─────────────────────────────────────────── */}
      <div className="rounded-cms-lg border border-cms-border bg-cms-surface p-5">
        <p className="font-mono text-xs tracking-widest uppercase text-cms-text-3 mb-3">
          Quick actions
        </p>
        <div className="flex items-center gap-2 flex-wrap">
          {collection.isPage ? (
            <EditPageButton collectionId={collection.id} />
          ) : (
            <>
              <Link
                href={`/cms/collections/${id}/entries`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-cms border border-cms-border bg-transparent text-cms-text-2 font-mono text-xs hover:border-cms-border-2 transition-colors no-underline"
              >
                <Book size={16} />
                View entries
              </Link>
              {canEdit && <NewEntryButton collectionId={collection.id} />}
            </>
          )}
          <Link
            href={`/cms/collections/${id}/media`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-cms border border-cms-border bg-transparent text-cms-text-2 font-mono text-xs hover:border-cms-border-2 transition-colors no-underline"
          >
            <Image size={16} />
            Media library
          </Link>
        </div>
      </div>

      {/* ── Fields snapshot ───────────────────────────────────────── */}
      <div className="rounded-cms-lg border border-cms-border bg-cms-surface p-5">
        <p className="font-mono text-xs tracking-widest uppercase text-cms-text-3 mb-3">
          Schema overview
        </p>
        <p className="text-sm text-cms-text mb-2">
          {fields.length} field{fields.length === 1 ? "" : "s"} defined.
        </p>
        <div className="grid grid-cols-1 gap-2">
          {fields.slice(0, 6).map((field) => (
            <div
              key={field.id}
              className="rounded-cms border border-cms-border bg-cms-surface-2 px-3 py-2 text-xs font-mono text-cms-text-2"
            >
              {field.name} • {field.type}
            </div>
          ))}
          {fields.length > 6 && (
            <div className="text-xs font-mono text-cms-text-3 mt-1">
              +{fields.length - 6} more fields
            </div>
          )}
        </div>
      </div>

      {/* ── Recent entries ─────────────────────────────────────────── */}
      <div className="rounded-cms-lg border border-cms-border bg-cms-surface p-5">
        <div className="flex items-center justify-between mb-3">
          <p className="font-mono text-xs tracking-widest uppercase text-cms-text-3">
            Recent entries
          </p>
          <Link
            href={`/cms/collections/${id}/entries`}
            className="font-mono text-xs text-cms-accent hover:underline"
          >
            View all
          </Link>
        </div>
        {recentEntries.length === 0 ? (
          <p className="text-sm text-cms-text-2">No entries available yet.</p>
        ) : (
          <div className="space-y-2">
            {recentEntries.map((entry) => (
              <Link
                key={entry.id}
                href={`/cms/collections/${id}/entries/${entry.id}`}
                className="block rounded-cms border border-cms-border bg-cms-surface-2 px-3 py-2 text-sm text-cms-text no-underline hover:bg-cms-surface"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono truncate">{entry.slug}</span>
                  <span className="text-xs text-cms-text-3">
                    {entry.status}
                  </span>
                </div>
                <span className="font-mono text-xs text-cms-text-3">
                  {new Date(entry.updatedAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* ── Sub-page cards ────────────────────────────────────────── */}
      <div className="space-y-2">
        <p className="font-mono text-xs tracking-widest uppercase text-cms-text-3">
          Manage
        </p>

        <SubPageCard
          href={`/cms/collections/${id}/settings`}
          label="Settings & members"
          description="Schema, tags, members & API keys"
          icon={<Wrench size={16} />}
        />
      </div>
    </div>
  );
}
