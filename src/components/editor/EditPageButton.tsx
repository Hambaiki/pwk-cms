"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { getOrCreatePageEntry } from "@/lib/actions/entries";
import { Edit } from "lucide-react";

export function EditPageButton({ collectionId }: { collectionId: string }) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleClick() {
    startTransition(async () => {
      const entryId = await getOrCreatePageEntry(collectionId);
      router.push(`/cms/collections/${collectionId}/entries/${entryId}`);
    });
  }

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-cms bg-cms-accent text-cms-accent-text font-mono text-xs font-medium border-none cursor-pointer shrink-0 transition-opacity disabled:opacity-60 disabled:cursor-not-allowed"
    >
      <Edit size={16} />
      {isPending ? "Opening…" : "Edit page"}
    </button>
  );
}
