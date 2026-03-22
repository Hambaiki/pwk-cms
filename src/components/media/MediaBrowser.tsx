"use client";

import { useState, useEffect, useTransition } from "react";
import { getMedia } from "@/lib/actions/media";
import type { Media } from "@/lib/db/schema";

function fmtSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

type Props = {
  collectionId: string;
};

export function MediaBrowser({ collectionId }: Props) {
  const [items, setItems] = useState<Media[]>([]);
  const [loading, startLoad] = useTransition();
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    startLoad(async () => {
      const result = await getMedia({
        collectionId,
        limit: 20,
      });
      setItems(result.items);
    });
  }, [collectionId]);

  const copyUrl = async (url: string, id: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error("Failed to copy URL:", err);
    }
  };

  return (
    <div className="p-4 border-b border-cms-border">
      <p className="font-mono text-xs tracking-[0.08em] uppercase text-cms-text-3 mb-3">
        Media Browser
      </p>

      {loading ? (
        <p className="font-mono text-xs text-cms-text-3 text-center py-4">
          Loading media…
        </p>
      ) : items.length === 0 ? (
        <p className="font-mono text-xs text-cms-text-3 text-center py-4">
          No media uploaded yet.
        </p>
      ) : (
        <div className="space-y-2 max-h-80 overflow-y-auto">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-2 p-2 rounded-cms border border-cms-border bg-cms-surface-2 hover:border-cms-border-2 transition-colors"
            >
              {/* Thumbnail */}
              <div className="w-8 h-8 rounded flex items-center justify-center bg-cms-surface-3 shrink-0 overflow-hidden">
                {item.mimeType.startsWith("image/") ? (
                  <img
                    src={item.publicUrl}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="font-mono text-xs text-cms-text-3">
                    {item.filename.split(".").pop()?.toUpperCase()}
                  </span>
                )}
              </div>

              {/* File info */}
              <div className="flex-1 min-w-0">
                <p className="font-mono text-xs text-cms-text-2 truncate">
                  {item.filename}
                </p>
                <p className="font-mono text-xs text-cms-text-3">
                  {fmtSize(item.size)}
                </p>
              </div>

              {/* Copy button */}
              <button
                onClick={() => copyUrl(item.publicUrl, item.id)}
                className="px-2 py-1 rounded border border-cms-border-2 bg-transparent text-cms-text-3 font-mono text-xs cursor-pointer hover:border-cms-accent hover:text-cms-accent transition-colors shrink-0"
                title="Copy URL"
              >
                {copiedId === item.id ? "Copied!" : "Copy URL"}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}