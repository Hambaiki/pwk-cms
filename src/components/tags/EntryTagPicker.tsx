"use client";

import { useState, useTransition } from "react";
import { setEntryTags } from "@/lib/actions/tags";
import { cn } from "@/lib/utils";
import type { Tag } from "@/lib/db/schema";

type Props = {
  entryId: string;
  initialTags: Tag[];
  allTags: Tag[];
};

export function EntryTagPicker({ entryId, initialTags, allTags }: Props) {
  const [selected, setSelected] = useState<Set<string>>(
    new Set(initialTags.map((t) => t.id)),
  );
  const [saving, startSave] = useTransition();
  const [search, setSearch] = useState("");
  const [saved, setSaved] = useState(false);

  const filtered = allTags.filter(
    (t) => !search || t.name.toLowerCase().includes(search.toLowerCase()),
  );

  function toggle(tagId: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(tagId) ? next.delete(tagId) : next.add(tagId);
      return next;
    });
    setSaved(false);
  }

  function handleSave() {
    startSave(async () => {
      await setEntryTags(entryId, [...selected]);
      setSaved(true);
    });
  }

  const selectedTags = allTags.filter((t) => selected.has(t.id));

  return (
    <div>
      <p className="font-mono text-xs tracking-[0.08em] uppercase text-cms-text-3 mb-2">
        Tags
      </p>

      {selectedTags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {selectedTags.map((tag) => (
            <button
              key={tag.id}
              onClick={() => toggle(tag.id)}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border border-[rgba(232,160,48,0.3)] bg-[rgba(232,160,48,0.08)] text-cms-accent font-mono text-xs cursor-pointer hover:bg-[rgba(232,160,48,0.15)] transition-colors"
            >
              {tag.name}
              <svg
                viewBox="0 0 10 10"
                fill="none"
                width="8"
                height="8"
                aria-hidden="true"
              >
                <path
                  d="M2 2l6 6M8 2L2 8"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          ))}
        </div>
      )}

      {allTags.length > 0 ? (
        <div className="rounded-cms border border-cms-border bg-cms-surface-2 overflow-hidden">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tags…"
            className="w-full font-mono text-sm px-2.5 py-1.5 bg-transparent text-cms-text outline-none border-b border-cms-border placeholder:text-cms-text-3"
          />
          <div className="max-h-36 overflow-y-auto">
            {filtered.length === 0 ? (
              <p className="font-mono text-xs text-cms-text-3 px-2.5 py-2">
                No tags match.
              </p>
            ) : (
              filtered.map((tag) => {
                const isSelected = selected.has(tag.id);
                return (
                  <button
                    key={tag.id}
                    onClick={() => toggle(tag.id)}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 text-left hover:bg-cms-surface-3 transition-colors cursor-pointer"
                  >
                    <span
                      className={cn(
                        "shrink-0 w-3.5 h-3.5 rounded border flex items-center justify-center transition-colors",
                        isSelected
                          ? "bg-cms-accent border-cms-accent"
                          : "border-cms-border-2",
                      )}
                    >
                      {isSelected && (
                        <svg
                          viewBox="0 0 10 10"
                          fill="none"
                          width="8"
                          height="8"
                        >
                          <path
                            d="M2 5l2.5 2.5L8 3"
                            stroke="var(--cms-accent-text)"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      )}
                    </span>
                    <span className="font-mono text-sm text-cms-text">
                      {tag.name}
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </div>
      ) : (
        <p className="font-mono text-xs text-cms-text-3">
          No tags yet.{" "}
          <a
            href="/cms/tags"
            className="text-cms-accent hover:underline underline-offset-2"
          >
            Create some
          </a>
          .
        </p>
      )}

      {allTags.length > 0 && (
        <button
          onClick={handleSave}
          disabled={saving}
          className={cn(
            "mt-2 w-full py-1 rounded-cms border border-cms-border bg-transparent font-mono text-xs",
            "cursor-pointer hover:border-cms-accent hover:text-cms-accent transition-colors disabled:opacity-60",
            saved
              ? "text-[#50c878] border-[rgba(40,160,90,0.3)]"
              : "text-cms-text-3",
          )}
        >
          {saving ? "Saving…" : saved ? "✓ Saved" : "Apply tags"}
        </button>
      )}
    </div>
  );
}
