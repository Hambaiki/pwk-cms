"use client";

import { useTransition } from "react";
import { createEntry } from "@/lib/actions/entries";
import { Plus } from "lucide-react";

export function NewEntryButton({ collectionId }: { collectionId: string }) {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      onClick={() => startTransition(() => createEntry(collectionId))}
      disabled={isPending}
      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-cms bg-cms-accent text-cms-accent-text font-mono text-xs font-medium border-none cursor-pointer shrink-0 transition-opacity disabled:opacity-60 disabled:cursor-not-allowed"
    >
      <Plus size={16} />
      {isPending ? "Creating…" : "New entry"}
    </button>
  );
}
