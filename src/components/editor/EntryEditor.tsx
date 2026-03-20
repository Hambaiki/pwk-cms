"use client";

import {
  useEffect,
  useRef,
  useState,
  useActionState,
  useTransition,
  useCallback,
} from "react";
import dynamic from "next/dynamic";
import {
  saveEntry,
  publishEntry,
  unpublishEntry,
  deleteEntry,
} from "@/lib/actions/entries";
import type { EntryFormState } from "@/lib/actions/entries";
import type { Entry, Collection, Field, Tag } from "@/lib/db/schema";
import { EntryTagPicker } from "@/components/tags/EntryTagPicker";

const BlockNoteEditorComponent = dynamic(() => import("./BlockNoteEditor"), {
  ssr: false,
  loading: () => (
    <div className="px-16 py-12 font-mono text-xs text-cms-text3">
      Loading editor…
    </div>
  ),
});

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
    cls: "bg-[rgba(90,88,85,0.15)] border-[rgba(90,88,85,0.3)] text-cms-text3",
  },
  published: {
    label: "published",
    cls: "bg-[rgba(40,160,90,0.1)] border-[rgba(40,160,90,0.25)] text-[#50c878]",
  },
  archived: {
    label: "archived",
    cls: "bg-[rgba(224,80,80,0.08)] border-[rgba(224,80,80,0.2)] text-cms-danger",
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
  const [content, setContent] = useState<unknown>(entry.content ?? {});
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
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const triggerSave = useCallback(() => {
    if (!formRef.current || !contentInputRef.current) return;
    contentInputRef.current.value = JSON.stringify(content);
    formRef.current.requestSubmit();
  }, [content]);

  const scheduleAutoSave = useCallback(() => {
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(triggerSave, 3000);
  }, [triggerSave]);

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
    "w-full font-mono text-xs px-2.5 py-1.5 rounded-cms border border-cms-border bg-cms-surface2 text-cms-text outline-none focus:border-[rgba(232,160,48,0.5)] transition-colors";

  return (
    <div className="flex h-full overflow-hidden">
      {/* Editor area */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Editor topbar */}
        <div className="flex items-center gap-3 px-6 h-12 border-b border-cms-border shrink-0 bg-cms-surface">
          <span className="text-sm">{collection.icon ?? "📄"}</span>
          <span className="font-mono text-xs text-cms-text3">
            {collection.name}
          </span>
          <span className="text-cms-border2 text-xs">/</span>
          <code className="font-mono text-xs text-cms-text2">{slug}</code>

          <div className="ml-auto flex items-center gap-2">
            {lastSaved && !savePending && (
              <span className="font-mono text-[10px] text-cms-text3">
                saved{" "}
                {lastSaved.toLocaleTimeString("en-US", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            )}
            {savePending && (
              <span className="font-mono text-[10px] text-cms-text3">
                saving…
              </span>
            )}
            <button
              onClick={triggerSave}
              disabled={savePending}
              className="px-3 py-1 rounded-cms border border-cms-border2 bg-transparent text-cms-text2 font-mono text-[11px] cursor-pointer disabled:opacity-60 hover:border-cms-accent transition-colors"
            >
              Save
            </button>
          </div>
        </div>

        {/* BlockNote */}
        <div className="flex-1 overflow-auto p-3">
          <BlockNoteEditorComponent
            initialContent={entry.content as any}
            onChange={(c) => {
              setContent(c);
              scheduleAutoSave();
            }}
          />
        </div>

        {/* Error bar */}
        {saveState?.errors?.general && (
          <div className="px-6 py-2 bg-[rgba(224,80,80,0.08)] border-t border-[rgba(224,80,80,0.2)] font-mono text-xs text-cms-danger">
            {saveState.errors.general.join(" ")}
          </div>
        )}
      </div>

      {/* Right sidebar */}
      <aside className="w-60 shrink-0 border-l border-cms-border bg-cms-surface flex flex-col overflow-auto">
        {/* Status + publish */}
        <div className="p-4 border-b border-cms-border">
          <p className="font-mono text-[10px] tracking-[0.08em] uppercase text-cms-text3 mb-2">
            Status
          </p>
          <span
            className={`inline-block font-mono text-[11px] px-2 py-0.5 rounded border mb-3 ${badge.cls}`}
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
              className="block w-full py-1.5 rounded-cms bg-cms-accent text-cms-accent-text font-mono text-[11px] font-medium border-none cursor-pointer disabled:opacity-60"
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
              className="block w-full py-1.5 rounded-cms border border-cms-border2 bg-transparent text-cms-text2 font-mono text-[11px] cursor-pointer disabled:opacity-60 hover:border-cms-accent transition-colors"
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

          <div>
            <label className="font-mono text-[10px] tracking-[0.08em] uppercase text-cms-text3 block mb-1.5">
              Slug
            </label>
            <input
              name="slug"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              className={`${inputCls} ${saveState?.errors?.slug ? "border-[rgba(224,80,80,0.5)]" : ""}`}
            />
            {saveState?.errors?.slug?.map((e) => (
              <p key={e} className="font-mono text-[10px] text-cms-danger mt-1">
                {e}
              </p>
            ))}
          </div>

          {fields
            .filter((f) => f.type !== "richtext")
            .map((field) => (
              <div key={field.id}>
                <label className="font-mono text-[10px] tracking-[0.08em] uppercase text-cms-text3 block mb-1.5">
                  {field.name}
                  {field.required && (
                    <span className="text-cms-danger ml-0.5">*</span>
                  )}
                </label>
                <MetaFieldInput
                  field={field}
                  entry={entry}
                  inputCls={inputCls}
                />
              </div>
            ))}
        </form>

        {/* Tags */}
        <div className="p-4 border-b border-cms-border">
          <EntryTagPicker
            entryId={entry.id}
            initialTags={entryTags}
            allTags={allTags}
          />
        </div>

        {/* Published at */}
        {entry.publishedAt && (
          <div className="px-4 py-3 border-b border-cms-border">
            <p className="font-mono text-[10px] tracking-[0.08em] uppercase text-cms-text3 mb-1">
              Published
            </p>
            <p className="font-mono text-[11px] text-cms-text2">
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
              className="w-full py-1.5 rounded-cms border border-cms-border bg-transparent text-cms-text3 font-mono text-[11px] cursor-pointer hover:text-cms-danger hover:border-[rgba(224,80,80,0.4)] transition-colors"
            >
              Delete entry
            </button>
          ) : (
            <div className="flex flex-col gap-1.5">
              <p className="font-mono text-[11px] text-cms-text2 text-center">
                Are you sure?
              </p>
              <button
                onClick={() =>
                  startDelete(() => deleteEntry(entry.id, collection.slug))
                }
                disabled={deletePending}
                className="py-1.5 rounded-cms border border-[rgba(224,80,80,0.4)] bg-[rgba(224,80,80,0.1)] text-cms-danger font-mono text-[11px] cursor-pointer disabled:opacity-60"
              >
                {deletePending ? "Deleting…" : "Yes, delete"}
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                className="py-1.5 rounded-cms border border-cms-border bg-transparent text-cms-text3 font-mono text-[11px] cursor-pointer hover:border-cms-border2 transition-colors"
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
}: {
  field: Field;
  entry: Entry;
  inputCls: string;
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
  return (
    <input
      type="text"
      name={`field_${field.slug}`}
      defaultValue={String(value ?? "")}
      className={inputCls}
    />
  );
}
