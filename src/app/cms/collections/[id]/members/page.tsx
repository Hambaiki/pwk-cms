import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { getCollectionById } from "@/lib/actions/collections";
import { getApiKeys } from "@/lib/actions/apiKeys";
import { getCollectionMembers } from "@/lib/actions/members";
import { ApiKeyList } from "@/components/settings/ApiKeyList";
import { CreateKeyForm } from "@/components/settings/CreateKeyForm";
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

  const [members, keys] = await Promise.all([
    getCollectionMembers(id),
    getApiKeys(id),
  ]);

  return (
    <div className="p-8 mx-auto space-y-10">
      {/* Breadcrumb back */}
      <Link
        href={`/cms/collections/${id}`}
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
        {collection.name}
      </Link>

      <div className="flex items-center gap-3">
        <span className="text-2xl">{collection.icon ?? "📄"}</span>
        <div>
          <h1 className="text-lg font-medium text-cms-text">
            Members & API keys
          </h1>
          <p className="font-mono text-sm text-cms-text-3">
            Manage who has access and how the API is authenticated
          </p>
        </div>
      </div>

      {/* Members */}
      <section>
        <h2 className="font-mono text-xs tracking-widest uppercase text-cms-text-3 mb-4">
          Members
        </h2>
        <MembersClient collectionId={collection.id} initialMembers={members} />
      </section>

      {/* API Keys */}
      <section>
        <h2 className="font-mono text-xs tracking-widest uppercase text-cms-text-3 mb-4">
          API keys
        </h2>
        <div className="space-y-6">
          <div className="rounded-cms-lg border border-cms-border bg-cms-surface p-4">
            <p className="font-mono text-sm text-cms-text-3 leading-relaxed">
              <span className="text-cms-accent">Public keys</span> — safe for
              frontend code, read published content only.{" "}
              <span className="text-[#7F77DD]">Private keys</span> — full
              read/write, never expose in client code.
            </p>
          </div>
          <ApiKeyList keys={keys} />
          <div className="rounded-cms-lg border border-cms-border bg-cms-surface p-5">
            <p className="font-mono text-xs tracking-widest uppercase text-cms-text-3 mb-4">
              Generate new key
            </p>
            <CreateKeyForm collectionId={collection.id} />
          </div>
        </div>
      </section>
    </div>
  );
}
