"use client";

import { useTransition, useState } from "react";
import { deleteCollection } from "@/lib/actions/collections";
import { cn } from "@/lib/utils";

type Props = {
  collectionId: string;
  collectionName: string;
};

export function DeleteCollectionButton({
  collectionId,
  collectionName,
}: Props) {
  const [isPending, startTransition] = useTransition();
  const [confirming, setConfirming] = useState(false);

  const baseBtnCls =
    "rounded-cms border px-3 py-1.5 font-mono text-[11px] cursor-pointer transition-all duration-200";

  if (confirming) {
    return (
      <div className="flex items-center gap-2">
        <span className="font-mono text-xs text-cms-text-3">
          Delete &ldquo;{collectionName}&rdquo;?
        </span>

        {/* Confirm delete */}
        <button
          onClick={() => startTransition(() => deleteCollection(collectionId))}
          disabled={isPending}
          className={cn(
            baseBtnCls,
            "border-cms-danger-border bg-cms-danger-subtle text-cms-danger",
            "hover:bg-cms-danger-dim active:scale-[0.98]",
            "disabled:opacity-60 disabled:cursor-not-allowed disabled:scale-100",
          )}
        >
          {isPending ? "Deleting…" : "Yes, delete"}
        </button>

        {/* Cancel */}
        <button
          onClick={() => setConfirming(false)}
          className={cn(
            baseBtnCls,
            "border-cms-border bg-transparent text-cms-text-3",
            "hover:text-cms-text hover:border-cms-border-2",
          )}
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className={cn(
        baseBtnCls,
        "border-cms-border bg-transparent text-cms-text-3",
        "hover:border-cms-danger-border hover:text-cms-danger",
      )}
    >
      Delete collection
    </button>
  );
}
