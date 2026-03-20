"use client";

import { useActionState, useTransition, useState } from "react";
import { createTag, deleteTag } from "@/lib/actions/tags";
import { cn } from "@/lib/utils";
import type { TagFormState } from "@/lib/actions/tags";
import type { Tag } from "@/lib/db/schema";

function DeleteTagButton({
  tag,
  onDeleted,
}: {
  tag: Tag;
  onDeleted: (id: string) => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [confirming, setConfirming] = useState(false);

  const baseCls =
    "px-2 py-0.5 rounded border font-mono text-[10px] cursor-pointer";

  if (confirming) {
    return (
      <div className="flex items-center gap-1.5">
        <span className="font-mono text-[10px] text-cms-text3">Remove?</span>
        <button
          onClick={() =>
            startTransition(async () => {
              await deleteTag(tag.id);
              onDeleted(tag.id);
            })
          }
          disabled={isPending}
          className={cn(
            baseCls,
            "border-[rgba(224,80,80,0.35)] bg-[rgba(224,80,80,0.1)] text-cms-danger disabled:opacity-60",
          )}
        >
          {isPending ? "…" : "Yes"}
        </button>
        <button
          onClick={() => setConfirming(false)}
          className={cn(
            baseCls,
            "border-cms-border bg-transparent text-cms-text3",
          )}
        >
          No
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className={cn(
        baseCls,
        "opacity-0 group-hover:opacity-100 border-cms-border bg-transparent text-cms-text3",
        "hover:text-cms-danger hover:border-[rgba(224,80,80,0.35)] transition-all",
      )}
    >
      Remove
    </button>
  );
}

const inputCls = cn(
  "w-full font-mono text-xs px-2.5 py-1.5 rounded-cms border border-cms-border",
  "bg-cms-surface2 text-cms-text outline-none focus:border-[rgba(232,160,48,0.5)] transition-colors",
);

export function TagsClient({ initialTags }: { initialTags: Tag[] }) {
  const [allTags, setAllTags] = useState<Tag[]>(initialTags);
  const [state, formAction, pending] = useActionState<TagFormState, FormData>(
    createTag,
    undefined,
  );

  const rowCls = cn(
    "group grid items-center gap-3 px-3.5 py-2.5 rounded-cms border border-cms-border",
    "bg-cms-surface hover:border-cms-border2 transition-colors",
  );

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-lg font-medium text-cms-text">Tags</h1>
        <p className="font-mono text-[11px] text-cms-text3 mt-1">
          Tags are shared across all collections and can be applied to any
          entry.
        </p>
      </div>

      {allTags.length === 0 ? (
        <div className="rounded-cms-lg border border-dashed border-cms-border px-6 py-10 text-center mb-8">
          <p className="font-mono text-xs text-cms-text3">
            No tags yet — create your first one below.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-0.5 mb-8">
          <div
            className="grid gap-3 px-3.5 py-1.5 font-mono text-[10px] tracking-[0.07em] uppercase text-cms-text3"
            style={{ gridTemplateColumns: "1fr 140px 80px" }}
          >
            <span>Name</span>
            <span>Slug</span>
            <span />
          </div>

          {allTags.map((tag) => (
            <div
              key={tag.id}
              className={rowCls}
              style={{ gridTemplateColumns: "1fr 140px 80px" }}
            >
              <div className="flex items-center gap-2">
                <span className="inline-block w-2 h-2 rounded-full bg-cms-accent opacity-60 shrink-0" />
                <span className="font-mono text-xs text-cms-text">
                  {tag.name}
                </span>
              </div>
              <code className="font-mono text-[11px] text-cms-text3">
                {tag.slug}
              </code>
              <div className="flex justify-end">
                <DeleteTagButton
                  tag={tag}
                  onDeleted={(id) =>
                    setAllTags((prev) => prev.filter((t) => t.id !== id))
                  }
                />
              </div>
            </div>
          ))}
        </div>
      )}

      <div>
        <p className="font-mono text-[10px] tracking-[0.1em] uppercase text-cms-text3 mb-3">
          New tag
        </p>
        <div className="rounded-cms-lg border border-cms-border bg-cms-surface p-5">
          <form action={formAction} className="space-y-3">
            {state?.errors?.general?.map((msg) => (
              <p
                key={msg}
                className="font-mono text-xs text-cms-danger bg-[rgba(224,80,80,0.08)] border border-[rgba(224,80,80,0.2)] rounded-cms px-3 py-2"
              >
                {msg}
              </p>
            ))}
            {state?.message && (
              <p className="font-mono text-xs text-[#50c878] bg-[rgba(40,160,90,0.08)] border border-[rgba(40,160,90,0.2)] rounded-cms px-3 py-2">
                {state.message}
              </p>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="font-mono text-[10px] tracking-[0.08em] uppercase text-cms-text3 block">
                  Name
                </label>
                <input
                  name="name"
                  type="text"
                  placeholder="Technology"
                  required
                  className={inputCls}
                />
                {state?.errors?.name?.map((e) => (
                  <p key={e} className="font-mono text-[10px] text-cms-danger">
                    {e}
                  </p>
                ))}
              </div>
              <div className="space-y-1.5">
                <label className="font-mono text-[10px] tracking-[0.08em] uppercase text-cms-text3 block">
                  Slug{" "}
                  <span className="text-cms-text3 normal-case tracking-normal font-normal">
                    (optional)
                  </span>
                </label>
                <input
                  name="slug"
                  type="text"
                  placeholder="auto-generated"
                  className={inputCls}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={pending}
              className="px-4 py-1.5 rounded-cms bg-cms-accent text-cms-accent-text font-mono text-xs font-medium border-none cursor-pointer disabled:opacity-60"
            >
              {pending ? "Creating…" : "Create tag"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
