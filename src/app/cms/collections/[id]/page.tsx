import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import {
  getCollectionById,
  getCollectionStats,
} from "@/lib/actions/collections";
import { DeleteCollectionButton } from "@/components/collections/DeleteCollectionButton";
import { CollectionForm } from "@/components/collections/CollectionForm";
import { NewEntryButton } from "@/components/editor/NewEntryButton";
import { EditPageButton } from "@/components/editor/EditPageButton";
import { RoleBadge } from "@/components/members/RoleBadge";

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
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Total entries", value: stats.totalEntries },
          { label: "Published", value: stats.publishedEntries },
          { label: "Media files", value: stats.totalMedia },
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
                href={`/cms/entries/${collection.slug}`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-cms border border-cms-border bg-transparent text-cms-text-2 font-mono text-xs hover:border-cms-border-2 transition-colors no-underline"
              >
                <svg viewBox="0 0 14 14" fill="none" width="12" height="12">
                  <path
                    d="M2 3h10M2 7h7M2 11h5"
                    stroke="currentColor"
                    strokeWidth="1.2"
                    strokeLinecap="round"
                  />
                </svg>
                View entries
              </Link>
              {canEdit && <NewEntryButton collectionId={collection.id} />}
            </>
          )}
          <Link
            href={`/cms/media?collection=${collection.id}`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-cms border border-cms-border bg-transparent text-cms-text-2 font-mono text-xs hover:border-cms-border-2 transition-colors no-underline"
          >
            <svg viewBox="0 0 14 14" fill="none" width="12" height="12">
              <rect
                x="1"
                y="2"
                width="12"
                height="10"
                rx="1.5"
                stroke="currentColor"
                strokeWidth="1.2"
              />
              <circle
                cx="4.5"
                cy="5.5"
                r="1.5"
                stroke="currentColor"
                strokeWidth="1.2"
              />
              <path
                d="M1 9l3-2.5 2.5 2 1.5-1.5 4 4"
                stroke="currentColor"
                strokeWidth="1.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Media library
          </Link>
        </div>
      </div>

      {/* ── Sub-page cards ────────────────────────────────────────── */}
      <div className="space-y-2">
        <p className="font-mono text-xs tracking-widest uppercase text-cms-text-3">
          Manage
        </p>

        <SubPageCard
          href={`/cms/collections/${id}/schema`}
          label="Schema"
          description={`${fields.length} field${fields.length !== 1 ? "s" : ""} defined`}
          icon={
            <svg viewBox="0 0 16 16" fill="none" width="16" height="16">
              <rect
                x="2"
                y="2"
                width="12"
                height="3"
                rx="1"
                stroke="currentColor"
                strokeWidth="1.2"
              />
              <rect
                x="2"
                y="7"
                width="8"
                height="3"
                rx="1"
                stroke="currentColor"
                strokeWidth="1.2"
              />
              <rect
                x="2"
                y="12"
                width="5"
                height="2"
                rx="1"
                stroke="currentColor"
                strokeWidth="1.2"
              />
            </svg>
          }
        />

        {isOwner && (
          <SubPageCard
            href={`/cms/collections/${id}/members`}
            label="Members & API keys"
            description={`${stats.totalMembers} member${stats.totalMembers !== 1 ? "s" : ""} · ${stats.totalApiKeys} key${stats.totalApiKeys !== 1 ? "s" : ""}`}
            icon={
              <svg viewBox="0 0 16 16" fill="none" width="16" height="16">
                <circle
                  cx="6"
                  cy="5"
                  r="2.5"
                  stroke="currentColor"
                  strokeWidth="1.2"
                />
                <path
                  d="M1 13c0-2.761 2.239-4 5-4s5 1.239 5 4"
                  stroke="currentColor"
                  strokeWidth="1.2"
                  strokeLinecap="round"
                />
                <path
                  d="M12 7a2 2 0 100-4M15 13c0-2-1.5-3.5-3-4"
                  stroke="currentColor"
                  strokeWidth="1.2"
                  strokeLinecap="round"
                />
              </svg>
            }
          />
        )}

        <SubPageCard
          href={`/cms/collections/${id}/api`}
          label="API reference"
          description={`GET /api/v1/${collection.slug}`}
          icon={
            <svg viewBox="0 0 16 16" fill="none" width="16" height="16">
              <path
                d="M3 5l4 4-4 4M9 13h5"
                stroke="currentColor"
                strokeWidth="1.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          }
        />
      </div>

      {/* ── Settings (owner only) ─────────────────────────────────── */}
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
