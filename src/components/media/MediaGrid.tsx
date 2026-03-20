"use client";

import { cn } from "@/lib/utils";
import {
  useState,
  useRef,
  useTransition,
  useActionState,
  useCallback,
  useEffect,
} from "react";
import { uploadMedia, deleteMedia, updateMediaAlt } from "@/lib/actions/media";
import type { UploadState } from "@/lib/actions/media";
import type { Media } from "@/lib/db/schema";

function fmtSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function MediaCard({
  item,
  onDelete,
  onAltSave,
}: {
  item: Media;
  onDelete: (id: string) => void;
  onAltSave: (id: string, alt: string) => void;
}) {
  const [showDetail, setShowDetail] = useState(false);
  const [altValue, setAltValue] = useState(item.alt ?? "");
  const [altSaving, startAltSave] = useTransition();
  const [deleting, startDelete] = useTransition();
  const ext = item.filename.split(".").pop()?.toUpperCase() ?? "FILE";

  return (
    <>
      <div
        onClick={() => setShowDetail(true)}
        className="rounded-cms border border-cms-border bg-cms-surface overflow-hidden cursor-pointer hover:border-cms-border-2 transition-colors duration-100"
      >
        <div className="h-30 bg-cms-surface-2 flex items-center justify-center overflow-hidden">
          {item.mimeType.startsWith("image/") ? (
            <img
              src={item.publicUrl}
              alt={item.alt ?? item.filename}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          ) : (
            <span className="font-mono text-sm font-medium text-cms-text-3 tracking-wide">
              {ext}
            </span>
          )}
        </div>
        <div className="px-2.5 py-2">
          <p className="font-mono text-[11px] text-cms-text-2 overflow-hidden text-ellipsis whitespace-nowrap mb-0.5">
            {item.filename}
          </p>
          <p className="font-mono text-[10px] text-cms-text-3">
            {fmtSize(item.size)}
          </p>
        </div>
      </div>

      {showDetail && (
        <div
          className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-6"
          onClick={() => setShowDetail(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-cms-surface border border-cms-border rounded-cms-xl w-full max-w-2xl overflow-hidden flex flex-col"
          >
            <div className="h-75 bg-cms-surface-2 flex items-center justify-center">
              {item.mimeType.startsWith("image/") ? (
                <img
                  src={item.publicUrl}
                  alt={item.alt ?? item.filename}
                  className="max-w-full max-h-full object-contain"
                />
              ) : (
                <span className="font-mono text-4xl text-cms-text-3">
                  {ext}
                </span>
              )}
            </div>

            <div className="p-5 flex flex-col gap-3.5">
              <div className="grid grid-cols-2 gap-3">
                {[
                  ["Filename", item.filename],
                  ["Size", fmtSize(item.size)],
                  ["Type", item.mimeType],
                  [
                    "Dimensions",
                    item.width && item.height
                      ? `${item.width} × ${item.height}`
                      : "—",
                  ],
                ].map(([label, value]) => (
                  <div key={label}>
                    <p className="font-mono text-[10px] tracking-[0.07em] uppercase text-cms-text-3 mb-0.5">
                      {label}
                    </p>
                    <p className="font-mono text-xs text-cms-text-2">{value}</p>
                  </div>
                ))}
              </div>

              {/* Alt text */}
              <div>
                <p className="font-mono text-[10px] tracking-[0.07em] uppercase text-cms-text-3 mb-1.5">
                  Alt text
                </p>
                <div className="flex gap-2">
                  <input
                    value={altValue}
                    onChange={(e) => setAltValue(e.target.value)}
                    placeholder="Describe the image for screen readers"
                    className="flex-1 font-mono text-xs px-2.5 py-1.5 rounded-cms border border-cms-border bg-cms-surface-2 text-cms-text outline-none focus:border-[rgba(232,160,48,0.5)] transition-colors"
                  />
                  <button
                    onClick={() =>
                      startAltSave(async () => {
                        await updateMediaAlt(item.id, altValue);
                        onAltSave(item.id, altValue);
                      })
                    }
                    disabled={altSaving}
                    className="px-3.5 py-1.5 rounded-cms bg-cms-accent text-cms-accent-text font-mono text-[11px] font-medium border-none cursor-pointer disabled:opacity-60"
                  >
                    {altSaving ? "Saving…" : "Save"}
                  </button>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                <code className="flex-1 font-mono text-[10px] text-cms-text-3 overflow-hidden text-ellipsis whitespace-nowrap">
                  {item.publicUrl}
                </code>
                <button
                  onClick={() => navigator.clipboard.writeText(item.publicUrl)}
                  className="shrink-0 px-2.5 py-1 rounded border border-cms-border bg-transparent text-cms-text-3 font-mono text-[10px] cursor-pointer hover:border-cms-border-2 transition-colors"
                >
                  Copy URL
                </button>
                <button
                  onClick={() =>
                    startDelete(async () => {
                      const r = await deleteMedia(item.id);
                      if (!r.error) {
                        onDelete(item.id);
                        setShowDetail(false);
                      }
                    })
                  }
                  disabled={deleting}
                  className="shrink-0 px-2.5 py-1 rounded border border-[rgba(224,80,80,0.3)] bg-[rgba(224,80,80,0.06)] text-cms-danger font-mono text-[10px] cursor-pointer disabled:opacity-60"
                >
                  {deleting ? "Deleting…" : "Delete"}
                </button>
                <button
                  onClick={() => setShowDetail(false)}
                  className="shrink-0 px-2.5 py-1 rounded border border-cms-border bg-transparent text-cms-text-3 font-mono text-[10px] cursor-pointer hover:border-cms-border-2 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function Dropzone({
  onUploaded,
  collectionId,
}: {
  onUploaded: (items: Media[]) => void;
  collectionId: string;
}) {
  const [uploadState, uploadAction, uploading] = useActionState<
    UploadState,
    FormData
  >(uploadMedia, undefined);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (uploadState?.uploaded?.length) onUploaded(uploadState.uploaded);
  }, [uploadState]);

  const submitFiles = useCallback(
    (files: FileList | File[]) => {
      const fd = new FormData();
      fd.set("collectionId", collectionId);
      Array.from(files).forEach((f) => fd.append("files", f));
      uploadAction(fd);
    },
    [collectionId, uploadAction],
  );

  return (
    <div>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          if (e.dataTransfer.files.length) submitFiles(e.dataTransfer.files);
        }}
        onClick={() => inputRef.current?.click()}
        className={`rounded-cms-lg border-[1.5px] border-dashed p-7 text-center cursor-pointer transition-all duration-150
          ${dragging ? "border-cms-accent bg-cms-accent-dim" : "border-cms-border-2 hover:border-cms-accent"}`}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          width="24"
          height="24"
          className="text-cms-text-3 mx-auto mb-2"
        >
          <path
            d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <p
          className={`font-mono text-xs ${uploading ? "text-cms-accent" : "text-cms-text-3"}`}
        >
          {uploading ? "Uploading…" : "Drop files here or click to browse"}
        </p>
        <p className="font-mono text-[10px] text-cms-text-3 mt-1">
          Images, video, PDF, CSV, ZIP — max 50 MB each
        </p>
        <input
          ref={inputRef}
          type="file"
          multiple
          onChange={(e) => {
            if (e.target.files?.length) submitFiles(e.target.files);
          }}
          accept="image/*,video/mp4,video/webm,application/pdf,text/plain,text/csv,application/zip"
          className="hidden"
        />
      </div>
      {uploadState?.errors?.general?.map((msg) => (
        <p
          key={msg}
          className="font-mono text-[11px] text-cms-danger bg-[rgba(224,80,80,0.08)] border border-cms-danger-border rounded-cms px-3 py-2 mt-2.5"
        >
          {msg}
        </p>
      ))}
    </div>
  );
}

export function MediaGrid({
  initialItems,
  initialTotal,
  collectionId,
  collectionName,
}: {
  initialItems: Media[];
  initialTotal: number;
  collectionId: string;
  collectionName?: string;
}) {
  const [items, setItems] = useState<Media[]>(initialItems);
  const [search, setSearch] = useState("");
  const [typeFilter, setType] = useState("");

  const filtered = items.filter((item) => {
    const matchSearch =
      !search || item.filename.toLowerCase().includes(search.toLowerCase());
    const matchType = !typeFilter || item.mimeType.startsWith(typeFilter);
    return matchSearch && matchType;
  });

  return (
    <div className="p-8 mx-auto">
      <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
        <div>
          <h1 className="text-lg font-medium text-cms-text">
            Media{collectionName ? ` — ${collectionName}` : ""}
          </h1>
          <p className="font-mono text-[11px] text-cms-text-3 mt-0.5">
            {initialTotal} file{initialTotal !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by filename…"
            className="font-mono text-xs px-3 py-1.5 rounded-cms border border-cms-border bg-cms-surface text-cms-text outline-none focus:border-[rgba(232,160,48,0.5)] w-48 transition-colors"
          />
          <select
            value={typeFilter}
            onChange={(e) => setType(e.target.value)}
            className="font-mono text-xs px-2.5 py-1.5 rounded-cms border border-cms-border bg-cms-surface text-cms-text outline-none cursor-pointer"
          >
            <option value="">All types</option>
            <option value="image/">Images</option>
            <option value="video/">Video</option>
            <option value="application/pdf">PDF</option>
            <option value="text/">Text / CSV</option>
          </select>
        </div>
      </div>

      <div className="mb-6">
        <Dropzone
          onUploaded={(newItems) => setItems((p) => [...newItems, ...p])}
          collectionId={collectionId}
        />
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-cms-lg border border-dashed border-cms-border px-6 py-12 text-center">
          <p className="font-mono text-xs text-cms-text-3">
            {search || typeFilter
              ? "No files match your filter."
              : "No files yet — drop some above."}
          </p>
        </div>
      ) : (
        <div
          className="grid gap-2.5"
          style={{
            gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
          }}
        >
          {filtered.map((item) => (
            <MediaCard
              key={item.id}
              item={item}
              onDelete={(id) => setItems((p) => p.filter((i) => i.id !== id))}
              onAltSave={(id, alt) =>
                setItems((p) => p.map((i) => (i.id === id ? { ...i, alt } : i)))
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}
