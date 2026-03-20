"use client";

import { cn } from "@/lib/utils";
import { useActionState, useState, useCallback, useId } from "react";
import { upsertFields } from "@/lib/actions/collections";
import type { FieldsFormState } from "@/lib/actions/collections";
import type { Field } from "@/lib/db/schema";

// ─── Types ─────────────────────────────────────────────────────────────────────

type FieldType = Field["type"];

type DraftField = {
  _key: string;
  id?: string;
  name: string;
  slug: string;
  type: FieldType;
  required: boolean;
  multiple: boolean;
  sortOrder: number;
  options: Record<string, unknown> | null;
};

const FIELD_TYPES: { value: FieldType; label: string; hint: string }[] = [
  { value: "text", label: "Text", hint: "Short single-line string" },
  { value: "textarea", label: "Textarea", hint: "Long plain text" },
  { value: "richtext", label: "Rich text", hint: "BlockNote block editor" },
  { value: "number", label: "Number", hint: "Integer or decimal" },
  { value: "boolean", label: "Boolean", hint: "True / false toggle" },
  { value: "date", label: "Date", hint: "Date or datetime" },
  { value: "media", label: "Media", hint: "File or image upload" },
  { value: "relation", label: "Relation", hint: "Link to another collection" },
  { value: "select", label: "Select", hint: "Fixed list of choices" },
];

function slugify(v: string) {
  return v
    .toLowerCase()
    .trim()
    .replace(/[^\w\s]/g, "")
    .replace(/\s+/g, "_");
}

function makeKey() {
  return Math.random().toString(36).slice(2);
}

function blankField(sortOrder: number): DraftField {
  return {
    _key: makeKey(),
    name: "",
    slug: "",
    type: "text",
    required: false,
    multiple: false,
    sortOrder,
    options: null,
  };
}

// ─── Shared styles ─────────────────────────────────────────────────────────────

const inputCls =
  "w-full font-mono text-xs px-2.5 py-1.5 rounded-cms border border-cms-border bg-cms-surface-2 text-cms-text outline-none focus:border-[rgba(232,160,48,0.5)] transition-colors";
const labelCls =
  "font-mono text-[10px] tracking-[0.07em] uppercase text-cms-text-3 block mb-1";

// ─── FieldTypeOptions ──────────────────────────────────────────────────────────

function FieldTypeOptions({
  field,
  onChange,
}: {
  field: DraftField;
  onChange: (patch: Partial<DraftField>) => void;
}) {
  if (field.type === "select") {
    const choices: string[] = (field.options?.choices as string[]) ?? [];
    return (
      <div className="space-y-2">
        <label className={labelCls}>Choices</label>
        {choices.map((c, i) => (
          <div key={i} className="flex gap-2">
            <input
              type="text"
              value={c}
              onChange={(e) => {
                const next = [...choices];
                next[i] = e.target.value;
                onChange({ options: { choices: next } });
              }}
              placeholder={`Choice ${i + 1}`}
              className={inputCls}
            />
            <button
              type="button"
              onClick={() =>
                onChange({
                  options: { choices: choices.filter((_, j) => j !== i) },
                })
              }
              className="text-cms-text-3 hover:text-cms-danger transition-colors px-1"
            >
              <svg viewBox="0 0 16 16" fill="none" className="w-4 h-4">
                <path
                  d="M3 3l10 10M13 3L3 13"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => onChange({ options: { choices: [...choices, ""] } })}
          className="font-mono text-[11px] text-cms-accent hover:opacity-80 transition-opacity"
        >
          + Add choice
        </button>
      </div>
    );
  }

  if (field.type === "number") {
    const opts = (field.options ?? {}) as {
      min?: number;
      max?: number;
      step?: number;
    };
    return (
      <div className="grid grid-cols-3 gap-3">
        {(["min", "max", "step"] as const).map((k) => (
          <div key={k}>
            <label className={labelCls}>{k}</label>
            <input
              type="number"
              value={opts[k] ?? ""}
              onChange={(e) =>
                onChange({
                  options: {
                    ...opts,
                    [k]: e.target.value ? Number(e.target.value) : undefined,
                  },
                })
              }
              placeholder="—"
              className={inputCls}
            />
          </div>
        ))}
      </div>
    );
  }

  return null;
}

// ─── FieldRow ──────────────────────────────────────────────────────────────────

function FieldRow({
  field,
  index,
  total,
  onMove,
  onChange,
  onDelete,
}: {
  field: DraftField;
  index: number;
  total: number;
  onMove: (from: number, to: number) => void;
  onChange: (key: string, patch: Partial<DraftField>) => void;
  onDelete: (key: string) => void;
}) {
  const [expanded, setExpanded] = useState(!field.id);
  const slugManualRef = { current: !!field.id };

  return (
    <div className="rounded-cms-lg border border-cms-border bg-cms-surface overflow-hidden">
      {/* Row header */}
      <div className="flex items-center gap-3 px-4 py-2.5">
        {/* Reorder buttons */}
        <div className="flex flex-col gap-0.5 shrink-0">
          <button
            type="button"
            disabled={index === 0}
            onClick={() => onMove(index, index - 1)}
            className="text-cms-text-3 hover:text-cms-text-2 disabled:opacity-20 transition-colors"
            aria-label="Move up"
          >
            <svg viewBox="0 0 12 12" fill="none" className="w-3 h-3">
              <path
                d="M6 9V3M3 6l3-3 3 3"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          <button
            type="button"
            disabled={index === total - 1}
            onClick={() => onMove(index, index + 1)}
            className="text-cms-text-3 hover:text-cms-text-2 disabled:opacity-20 transition-colors"
            aria-label="Move down"
          >
            <svg viewBox="0 0 12 12" fill="none" className="w-3 h-3">
              <path
                d="M6 3v6M3 6l3 3 3-3"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>

        {/* Type badge */}
        <span className="shrink-0 font-mono text-[10px] px-1.5 py-0.5 rounded border border-cms-border bg-cms-surface-2 text-cms-text-3">
          {field.type}
        </span>

        {/* Name */}
        <input
          type="text"
          value={field.name}
          onChange={(e) => {
            const name = e.target.value;
            const patch: Partial<DraftField> = { name };
            if (!slugManualRef.current && !field.id) patch.slug = slugify(name);
            onChange(field._key, patch);
          }}
          placeholder="Field name"
          className="flex-1 bg-transparent font-mono text-xs text-cms-text outline-none placeholder:text-cms-text-3"
        />

        {field.required && (
          <span className="shrink-0 font-mono text-[10px] text-cms-danger">
            required
          </span>
        )}

        <button
          type="button"
          onClick={() => setExpanded((x) => !x)}
          className="shrink-0 text-cms-text-3 hover:text-cms-text-2 transition-colors"
          aria-label={expanded ? "Collapse" : "Expand"}
        >
          <svg
            viewBox="0 0 16 16"
            fill="none"
            className={cn(
              "w-4 h-4 transition-transform",
              expanded && "rotate-180",
            )}
          >
            <path
              d="M4 6l4 4 4-4"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>

        <button
          type="button"
          onClick={() => onDelete(field._key)}
          className="shrink-0 text-cms-text-3 hover:text-cms-danger transition-colors"
          aria-label="Delete field"
        >
          <svg viewBox="0 0 16 16" fill="none" className="w-4 h-4">
            <path
              d="M3 3l10 10M13 3L3 13"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        </button>
      </div>

      {/* Expanded settings */}
      {expanded && (
        <div className="border-t border-cms-border px-4 py-4 space-y-4 bg-cms-surface-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Slug */}
            <div>
              <label className={labelCls}>Slug</label>
              <input
                type="text"
                value={field.slug}
                onChange={(e) => onChange(field._key, { slug: e.target.value })}
                placeholder="field_slug"
                className={cn(inputCls, "font-mono")}
              />
            </div>
            {/* Type */}
            <div>
              <label className={labelCls}>Type</label>
              <select
                value={field.type}
                onChange={(e) =>
                  onChange(field._key, {
                    type: e.target.value as FieldType,
                    options: null,
                  })
                }
                className={cn(inputCls, "cursor-pointer")}
              >
                {FIELD_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label} — {t.hint}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Flags */}
          <div className="flex flex-wrap gap-6">
            {[
              { name: "required", label: "Required", checked: field.required },
              {
                name: "multiple",
                label: "Allow multiple",
                checked: field.multiple,
              },
            ].map(({ name, label, checked }) => (
              <label
                key={name}
                className="flex items-center gap-2 cursor-pointer select-none"
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={(e) =>
                    onChange(field._key, {
                      [name]: e.target.checked,
                    } as Partial<DraftField>)
                  }
                  className="w-4 h-4 rounded accent-cms-accent border-cms-border bg-cms-surface-2"
                />
                <span className="font-mono text-xs text-cms-text-2">
                  {label}
                </span>
              </label>
            ))}
          </div>

          <FieldTypeOptions
            field={field}
            onChange={(patch) => onChange(field._key, patch)}
          />
        </div>
      )}
    </div>
  );
}

// ─── SchemaBuilder ─────────────────────────────────────────────────────────────

export function SchemaBuilder({
  collectionId,
  initialFields,
}: {
  collectionId: string;
  initialFields: Field[];
}) {
  const formId = useId();

  const [draftFields, setDraftFields] = useState<DraftField[]>(() =>
    initialFields.map((f) => ({
      _key: makeKey(),
      id: f.id,
      name: f.name,
      slug: f.slug,
      type: f.type,
      required: f.required,
      multiple: f.multiple,
      sortOrder: f.sortOrder,
      options: (f.options as Record<string, unknown>) ?? null,
    })),
  );

  const [deletedIds, setDeletedIds] = useState<string[]>([]);
  const [state, formAction, pending] = useActionState<
    FieldsFormState,
    FormData
  >(upsertFields, undefined);

  const handleAdd = useCallback(
    () => setDraftFields((p) => [...p, blankField(p.length)]),
    [],
  );
  const handleMove = useCallback((from: number, to: number) => {
    setDraftFields((p) => {
      const next = [...p];
      const [item] = next.splice(from, 1);
      next.splice(to, 0, item);
      return next.map((f, i) => ({ ...f, sortOrder: i }));
    });
  }, []);
  const handleChange = useCallback(
    (key: string, patch: Partial<DraftField>) => {
      setDraftFields((p) =>
        p.map((f) => (f._key === key ? { ...f, ...patch } : f)),
      );
    },
    [],
  );
  const handleDelete = useCallback((key: string) => {
    setDraftFields((p) => {
      const field = p.find((f) => f._key === key);
      if (field?.id) setDeletedIds((d) => [...d, field.id!]);
      return p.filter((f) => f._key !== key);
    });
  }, []);

  function buildPayload() {
    return JSON.stringify({
      collectionId,
      fields: draftFields.map((f, i) => ({
        id: f.id,
        name: f.name,
        slug: f.slug,
        type: f.type,
        required: f.required,
        multiple: f.multiple,
        sortOrder: i,
        options: f.options,
      })),
      deletedFieldIds: deletedIds,
    });
  }

  return (
    <div className="space-y-4">
      {state?.errors?.general?.map((msg) => (
        <p
          key={msg}
          className="font-mono text-xs text-cms-danger bg-cms-danger-dim border border-cms-danger-border rounded-cms px-3 py-2"
        >
          {msg}
        </p>
      ))}
      {state?.message && (
        <p className="font-mono text-xs text-[#50c878] bg-cms-success-subtle border border-cms-success-border rounded-cms px-3 py-2">
          {state.message}
        </p>
      )}

      {/* Field list */}
      <div className="space-y-2">
        {draftFields.length === 0 ? (
          <div className="rounded-cms-lg border border-dashed border-cms-border px-6 py-10 text-center">
            <p className="font-mono text-xs text-cms-text-3">
              No fields yet — add one below.
            </p>
          </div>
        ) : (
          draftFields.map((field, i) => (
            <FieldRow
              key={field._key}
              field={field}
              index={i}
              total={draftFields.length}
              onMove={handleMove}
              onChange={handleChange}
              onDelete={handleDelete}
            />
          ))
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 pt-1">
        <button
          type="button"
          onClick={handleAdd}
          className="inline-flex items-center gap-1.5 rounded-cms border border-cms-border bg-cms-surface-2 px-4 py-1.5 font-mono text-xs text-cms-text-2 hover:border-cms-border-2 hover:text-cms-text transition-colors"
        >
          <svg
            viewBox="0 0 16 16"
            fill="none"
            className="w-3.5 h-3.5"
            aria-hidden="true"
          >
            <path
              d="M8 3v10M3 8h10"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
          Add field
        </button>

        <form
          id={formId}
          action={formAction}
          onSubmit={(e) => {
            const input = e.currentTarget.querySelector<HTMLInputElement>(
              '[name="fieldsPayload"]',
            )!;
            input.value = buildPayload();
          }}
          className="flex-1 flex justify-end"
        >
          <input type="hidden" name="fieldsPayload" defaultValue="" />
          <button
            type="submit"
            disabled={pending}
            className="px-5 py-1.5 rounded-cms bg-cms-accent text-cms-accent-text font-mono text-xs font-medium border-none cursor-pointer transition-opacity disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {pending ? "Saving…" : "Save fields"}
          </button>
        </form>
      </div>
    </div>
  );
}
