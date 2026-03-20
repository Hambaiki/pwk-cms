"use client";

import { cn } from "@/lib/utils";
import { useState, useEffect, useTransition } from "react";
import { getMedia } from "@/lib/actions/media";
import type { Media } from "@/lib/db/schema";

type Props = {
  onSelect: (item: Media) => void;
  onClose: () => void;
  collectionId: string;
  mimePrefix?: string;
};

function fmtSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function MediaPicker({
  onSelect,
  onClose,
  collectionId,
  mimePrefix,
}: Props) {
  const [items, setItems] = useState<Media[]>([]);
  const [search, setSearch] = useState("");
  const [loading, startLoad] = useTransition();

  useEffect(() => {
    const t = setTimeout(
      () => {
        startLoad(async () => {
          const result = await getMedia({
            collectionId,
            search: search || undefined,
            mimePrefix,
            limit: 60,
          });
          setItems(result.items);
        });
      },
      search ? 300 : 0,
    );
    return () => clearTimeout(t);
  }, [collectionId, search, mimePrefix]);

  return (
    <div
      className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-6"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-cms-surface border border-cms-border rounded-cms-xl w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-cms-border shrink-0">
          <p className="font-mono text-xs font-medium text-cms-text flex-1">
            Select media
          </p>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search…"
            autoFocus
            className="font-mono text-xs px-2.5 py-1.5 rounded-cms border border-cms-border bg-cms-surface-2 text-cms-text outline-none focus:border-[rgba(232,160,48,0.5)] w-40 transition-colors"
          />
          <button
            onClick={onClose}
            className="text-cms-text-3 hover:text-cms-text transition-colors p-1"
          >
            <svg viewBox="0 0 14 14" fill="none" width="14" height="14">
              <path
                d="M1 1l12 12M13 1L1 13"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

        {/* Grid */}
        <div className="flex-1 overflow-auto p-3">
          {loading && items.length === 0 ? (
            <p className="font-mono text-xs text-cms-text-3 text-center py-10">
              Loading…
            </p>
          ) : items.length === 0 ? (
            <div className="text-center py-10 space-y-2">
              <p className="font-mono text-xs text-cms-text-3">
                No files found.
              </p>
              <p className="font-mono text-[11px] text-cms-text-3">
                Upload files in the Media library for this collection first.
              </p>
            </div>
          ) : (
            <div
              className="grid gap-2"
              style={{
                gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))",
              }}
            >
              {items.map((item) => (
                <div
                  key={item.id}
                  onClick={() => onSelect(item)}
                  className="rounded-cms border border-cms-border overflow-hidden cursor-pointer bg-cms-surface-2 hover:border-cms-accent transition-colors duration-100"
                >
                  <div className="h-22.5 overflow-hidden flex items-center justify-center bg-cms-surface-3">
                    {item.mimeType.startsWith("image/") ? (
                      <img
                        src={item.publicUrl}
                        alt={item.alt ?? item.filename}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <span className="font-mono text-[11px] text-cms-text-3">
                        {item.filename.split(".").pop()?.toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="px-2 py-1.5">
                    <p className="font-mono text-[10px] text-cms-text-2 overflow-hidden text-ellipsis whitespace-nowrap">
                      {item.filename}
                    </p>
                    <p className="font-mono text-[10px] text-cms-text-3">
                      {fmtSize(item.size)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
