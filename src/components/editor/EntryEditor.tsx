"use client";

import { cn } from "@/lib/utils";
import {
  useEffect,
  useRef,
  useState,
  useActionState,
  useTransition,
  useCallback,
} from "react";
import { createPortal } from "react-dom";
import dynamic from "next/dynamic";
import type { Block } from "@blocknote/core";
import {
  saveEntry,
  publishEntry,
  unpublishEntry,
  deleteEntry,
} from "@/lib/actions/entries";
import type { EntryFormState } from "@/lib/actions/entries";
import type { Entry, Collection, Field, Tag } from "@/lib/db/schema";
import { EntryTagPicker } from "@/components/tags/EntryTagPicker";
import { MediaPicker } from "@/components/media/MediaPicker";
import { MediaBrowser } from "@/components/media/MediaBrowser";

const BlockNoteEditorComponent = dynamic(
  () => import("./BlockNoteEditor"),
  { ssr: false }, // This disables server-side rendering for this component
);

type Props = {
  entry: Entry;
  collection: Collection;
  fields: Field[];
  allTags: Tag[];
  entryTags: Tag[];
};

const statusBadge = {
  draft: {
    label: "draft",
    cls: "bg-[rgba(90,88,85,0.15)] border-[rgba(90,88,85,0.3)] text-cms-text-3",
  },
  published: {
    label: "published",
    cls: "bg-[rgba(40,160,90,0.1)] border-[rgba(40,160,90,0.25)] text-[#50c878]",
  },
  archived: {
    label: "archived",
    cls: "bg-[rgba(224,80,80,0.08)] border-cms-danger-border text-cms-danger",
  },
};

export function EntryEditor({
  entry,
  collection,
  fields,
  allTags,
  entryTags,
}: Props) {
  const [slug, setSlug] = useState(entry.slug);
  const [content, setContent] = useState<Block[]>(
    Array.isArray(entry.content) ? entry.content : [],
  );
  const [contentHtml, setContentHtml] = useState<string>(
    entry.contentHtml ?? "",
  );
  const [saveState, saveAction, savePending] = useActionState<
    EntryFormState,
    FormData
  >(saveEntry, undefined);
  const [publishPending, startPublish] = useTransition();
  const [deletePending, startDelete] = useTransition();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [status, setStatus] = useState(entry.status);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  const formRef = useRef<HTMLFormElement>(null);
  const contentInputRef = useRef<HTMLInputElement>(null);
  const contentHtmlInputRef = useRef<HTMLInputElement>(null);
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const triggerSave = useCallback(() => {
    if (
      !formRef.current ||
      !contentInputRef.current ||
      !contentHtmlInputRef.current
    )
      return;
    contentInputRef.current.value = JSON.stringify(content);
    contentHtmlInputRef.current.value = contentHtml;
    formRef.current.requestSubmit();
  }, [content, contentHtml]);

  const scheduleAutoSave = useCallback(() => {
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(triggerSave, 3000);
  }, [triggerSave]);

  const handleContentChange = useCallback(
    (c: Block[], html?: string) => {
      setContent(c);
      if (html !== undefined) {
        setContentHtml(html);
      }
      scheduleAutoSave();
    },
    [scheduleAutoSave],
  );

  useEffect(
    () => () => {
      if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    },
    [],
  );
  useEffect(() => {
    if (saveState?.message === "Saved.") setLastSaved(new Date());
  }, [saveState]);

  const badge = statusBadge[status];
  const inputCls =
    "w-full font-mono text-xs px-2.5 py-1.5 rounded-cms border border-cms-border bg-cms-surface-2 text-cms-text outline-none focus:border-[rgba(232,160,48,0.5)] transition-colors";

  return (
    <div className="flex h-full overflow-hidden">
      {/* Editor area */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Editor topbar */}
        <div className="flex items-center gap-3 px-6 h-12 border-b border-cms-border shrink-0 bg-cms-surface">
          <span className="text-sm">{collection.icon ?? "📄"}</span>
          <span className="font-mono text-xs text-cms-text-3">
            {collection.name}
          </span>
          <span className="text-cms-border-2 text-xs">/</span>
          <code className="font-mono text-xs text-cms-text-2">{slug}</code>

          <div className="ml-auto flex items-center gap-2">
            {lastSaved && !savePending && (
              <span className="font-mono text-xs text-cms-text-3">
                saved{" "}
                {lastSaved.toLocaleTimeString("en-US", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            )}
            {savePending && (
              <span className="font-mono text-xs text-cms-text-3">saving…</span>
            )}
            <button
              onClick={triggerSave}
              disabled={savePending}
              className="px-3 py-1 rounded-cms border border-cms-border-2 bg-transparent text-cms-text-2 font-mono text-sm cursor-pointer disabled:opacity-60 hover:border-cms-accent transition-colors"
            >
              Save
            </button>
          </div>
        </div>

        {/* BlockNote */}
        <div className="flex-1 overflow-auto p-2">
          <BlockNoteEditorComponent
            initialContent={entry.content}
            onChange={handleContentChange}
          />
        </div>

        {/* Error bar */}
        {saveState?.errors?.general && (
          <div className="px-6 py-2 bg-[rgba(224,80,80,0.08)] border-t border-cms-danger-border font-mono text-xs text-cms-danger">
            {saveState.errors.general.join(" ")}
          </div>
        )}
      </div>

      {/* Right sidebar */}
      <aside className="w-60 shrink-0 border-l border-cms-border bg-cms-surface flex flex-col overflow-auto">
        {/* Status + publish */}
        <div className="p-4 border-b border-cms-border">
          <p className="font-mono text-xs tracking-[0.08em] uppercase text-cms-text-3 mb-2">
            Status
          </p>
          <span
            className={cn(
              `inline-block font-mono text-sm px-2 py-0.5 rounded border mb-3`,
              badge.cls,
            )}
          >
            {badge.label}
          </span>
          {status === "draft" ? (
            <button
              onClick={() =>
                startPublish(async () => {
                  await publishEntry(entry.id);
                  setStatus("published");
                })
              }
              disabled={publishPending}
              className="block w-full py-1.5 rounded-cms bg-cms-accent text-cms-accent-text font-mono text-sm font-medium border-none cursor-pointer disabled:opacity-60"
            >
              {publishPending ? "Publishing…" : "Publish"}
            </button>
          ) : (
            <button
              onClick={() =>
                startPublish(async () => {
                  await unpublishEntry(entry.id);
                  setStatus("draft");
                })
              }
              disabled={publishPending}
              className="block w-full py-1.5 rounded-cms border border-cms-border-2 bg-transparent text-cms-text-2 font-mono text-sm cursor-pointer disabled:opacity-60 hover:border-cms-accent transition-colors"
            >
              {publishPending ? "Unpublishing…" : "Unpublish"}
            </button>
          )}
        </div>

        {/* Slug + field inputs */}
        <form
          ref={formRef}
          action={saveAction}
          className="p-4 border-b border-cms-border flex flex-col gap-3"
        >
          <input type="hidden" name="entryId" value={entry.id} />
          <input
            type="hidden"
            name="content"
            ref={contentInputRef}
            defaultValue={JSON.stringify(content)}
          />
          <input
            type="hidden"
            name="contentHtml"
            ref={contentHtmlInputRef}
            defaultValue=""
          />

          <div>
            <label className="font-mono text-xs tracking-[0.08em] uppercase text-cms-text-3 block mb-1.5">
              Slug
            </label>
            <input
              name="slug"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              className={cn(
                inputCls,
                saveState?.errors?.slug ? "border-[rgba(224,80,80,0.5)]" : "",
              )}
            />
            {saveState?.errors?.slug?.map((e) => (
              <p key={e} className="font-mono text-xs text-cms-danger mt-1">
                {e}
              </p>
            ))}
          </div>

          {fields
            .filter((f) => f.type !== "richtext")
            .map((field) => (
              <div key={field.id}>
                <div className="flex items-center gap-1.5 mb-1.5">
                  <label className="font-mono text-xs tracking-[0.08em] uppercase text-cms-text-3">
                    {field.name}
                    {field.required && (
                      <span className="text-cms-danger ml-0.5">*</span>
                    )}
                  </label>
                  {field.type === "media" && (
                    <span className="font-mono text-xxs px-1 py-px rounded border border-cms-border text-cms-text-3 bg-cms-surface-2">
                      media
                    </span>
                  )}
                </div>
                <MetaFieldInput
                  field={field}
                  entry={entry}
                  inputCls={inputCls}
                  collectionId={collection.id}
                />
              </div>
            ))}
        </form>

        {/* Tags */}
        <div className="p-4 border-b border-cms-border">
          <EntryTagPicker
            entryId={entry.id}
            collectionId={collection.id}
            initialTags={entryTags}
            allTags={allTags}
          />
        </div>

        {/* Media Browser */}
        <MediaBrowser collectionId={collection.id} />

        {/* Published at */}
        {entry.publishedAt && (
          <div className="px-4 py-3 border-b border-cms-border">
            <p className="font-mono text-xs tracking-[0.08em] uppercase text-cms-text-3 mb-1">
              Published
            </p>
            <p className="font-mono text-sm text-cms-text-2">
              {new Date(entry.publishedAt).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </p>
          </div>
        )}

        {/* Delete */}
        <div className="p-4 mt-auto">
          {!confirmDelete ? (
            <button
              onClick={() => setConfirmDelete(true)}
              className="w-full py-1.5 rounded-cms border border-cms-border bg-transparent text-cms-text-3 font-mono text-sm cursor-pointer hover:text-cms-danger hover:border-cms-danger-subtle transition-colors"
            >
              Delete entry
            </button>
          ) : (
            <div className="flex flex-col gap-1.5">
              <p className="font-mono text-sm text-cms-text-2 text-center">
                Are you sure?
              </p>
              <button
                onClick={() =>
                  startDelete(() => deleteEntry(entry.id, collection.id))
                }
                disabled={deletePending}
                className="py-1.5 rounded-cms border border-cms-danger-subtle bg-cms-danger-dim text-cms-danger font-mono text-sm cursor-pointer disabled:opacity-60"
              >
                {deletePending ? "Deleting…" : "Yes, delete"}
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                className="py-1.5 rounded-cms border border-cms-border bg-transparent text-cms-text-3 font-mono text-sm cursor-pointer hover:border-cms-border-2 transition-colors"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}

function MetaFieldInput({
  field,
  entry,
  inputCls,
  collectionId,
}: {
  field: Field;
  entry: Entry;
  inputCls: string;
  collectionId: string;
}) {
  const content = (entry.content as Record<string, unknown>) ?? {};
  const value = content[field.slug];

  if (field.type === "boolean") {
    return (
      <input
        type="checkbox"
        name={`field_${field.slug}`}
        defaultChecked={Boolean(value)}
        className="w-4 h-4 accent-cms-accent"
      />
    );
  }
  if (field.type === "date") {
    return (
      <input
        type="date"
        name={`field_${field.slug}`}
        defaultValue={value ? String(value).slice(0, 10) : ""}
        className={inputCls}
      />
    );
  }
  if (field.type === "number") {
    return (
      <input
        type="number"
        name={`field_${field.slug}`}
        defaultValue={value !== undefined ? String(value) : ""}
        className={inputCls}
      />
    );
  }
  if (field.type === "select") {
    const choices = ((field.options as any)?.choices as string[]) ?? [];
    return (
      <select
        name={`field_${field.slug}`}
        defaultValue={String(value ?? "")}
        className={`${inputCls} cursor-pointer`}
      >
        <option value="">— select —</option>
        {choices.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>
    );
  }
  if (field.type === "textarea") {
    return (
      <textarea
        name={`field_${field.slug}`}
        defaultValue={String(value ?? "")}
        rows={3}
        className={`${inputCls} resize-y`}
      />
    );
  }
  if (field.type === "media") {
    return (
      <MediaFieldInput
        fieldSlug={field.slug}
        collectionId={collectionId}
        initialUrl={value ? String(value) : ""}
      />
    );
  }
  return (
    <input
      type="text"
      name={`field_${field.slug}`}
      defaultValue={String(value ?? "")}
      className={inputCls}
    />
  );
}

// ─── MediaFieldInput ───────────────────────────────────────────────────────────
// Renders a clearly interactive media picker button with thumbnail preview.

function MediaFieldInput({
  fieldSlug,
  collectionId,
  initialUrl,
}: {
  fieldSlug: string;
  collectionId: string;
  initialUrl: string;
}) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [url, setUrl] = useState(initialUrl);
  const isImage = url && /\.(jpg|jpeg|png|gif|webp|svg|avif)$/i.test(url);

  return (
    <>
      <input type="hidden" name={`field_${fieldSlug}`} value={url} />

      {url ? (
        /* ── File selected — show preview + action buttons ── */
        <div className="rounded-cms border border-cms-border overflow-hidden">
          {/* Thumbnail */}
          <div className="relative bg-cms-surface-3" style={{ height: "96px" }}>
            {isImage ? (
              <img src={url} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center gap-1">
                <svg
                  viewBox="0 0 20 20"
                  fill="none"
                  width="20"
                  height="20"
                  className="text-cms-text-3"
                >
                  <path
                    d="M4 4h12v12H4V4zM8 8h4M8 12h2"
                    stroke="currentColor"
                    strokeWidth="1.2"
                    strokeLinecap="round"
                  />
                </svg>
                <span className="font-mono text-xs text-cms-text-3 px-2 text-center truncate w-full">
                  {url.split("/").pop()?.split("?")[0]}
                </span>
              </div>
            )}
          </div>
          {/* Actions row */}
          <div className="flex items-center gap-2 px-2.5 py-2 bg-cms-surface border-t border-cms-border">
            <button
              type="button"
              onClick={() => setPickerOpen(true)}
              className="flex-1 inline-flex items-center gap-1.5 font-mono text-sm text-cms-text-2 hover:text-cms-text transition-colors cursor-pointer"
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
              Change
            </button>
            <button
              type="button"
              onClick={() => setUrl("")}
              className="font-mono text-sm text-cms-text-3 hover:text-cms-danger transition-colors cursor-pointer"
              aria-label="Remove file"
            >
              Remove
            </button>
          </div>
        </div>
      ) : (
        /* ── No file — prominent picker button ── */
        <button
          type="button"
          onClick={() => setPickerOpen(true)}
          className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-cms border border-dashed border-cms-border bg-cms-surface hover:border-cms-accent hover:bg-cms-accent-dim transition-colors cursor-pointer group"
        >
          <div className="w-7 h-7 rounded-cms flex items-center justify-center bg-cms-surface-2 border border-cms-border group-hover:border-cms-accent group-hover:text-cms-accent text-cms-text-3 transition-colors shrink-0">
            <svg viewBox="0 0 14 14" fill="none" width="13" height="13">
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
          </div>
          <div className="text-left">
            <p className="font-mono text-sm text-cms-text-2 group-hover:text-cms-text transition-colors">
              Choose file
            </p>
            <p className="font-mono text-xs text-cms-text-3">
              Browse media library
            </p>
          </div>
        </button>
      )}

      {pickerOpen &&
        typeof document !== "undefined" &&
        createPortal(
          <MediaPicker
            collectionId={collectionId}
            onSelect={(item) => {
              setUrl(item.publicUrl);
              setPickerOpen(false);
            }}
            onClose={() => setPickerOpen(false)}
          />,
          document.body,
        )}
    </>
  );
}
