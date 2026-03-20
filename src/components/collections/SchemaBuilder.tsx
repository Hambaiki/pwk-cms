'use client'

import { useActionState, useState, useCallback, useId } from 'react'
import { upsertFields } from '@/lib/actions/collections'
import type { FieldsFormState } from '@/lib/actions/collections'
import type { Field } from '@/lib/db/schema'

// ─── Types ─────────────────────────────────────────────────────────────────────

type FieldType = Field['type']

type DraftField = {
  _key: string           // stable UI key (not the DB id)
  id?: string            // present for existing fields
  name: string
  slug: string
  type: FieldType
  required: boolean
  multiple: boolean
  sortOrder: number
  options: Record<string, unknown> | null
}

const FIELD_TYPES: { value: FieldType; label: string; hint: string }[] = [
  { value: 'text',      label: 'Text',      hint: 'Short single-line string' },
  { value: 'textarea',  label: 'Textarea',  hint: 'Long plain text' },
  { value: 'richtext',  label: 'Rich text', hint: 'BlockNote block editor' },
  { value: 'number',    label: 'Number',    hint: 'Integer or decimal' },
  { value: 'boolean',   label: 'Boolean',   hint: 'True / false toggle' },
  { value: 'date',      label: 'Date',      hint: 'Date or datetime' },
  { value: 'media',     label: 'Media',     hint: 'File or image upload' },
  { value: 'relation',  label: 'Relation',  hint: 'Link to another collection' },
  { value: 'select',    label: 'Select',    hint: 'Fixed list of choices' },
]

function slugify(v: string) {
  return v.toLowerCase().trim()
    .replace(/[^\w\s]/g, '').replace(/\s+/g, '_')
}

function makeKey() {
  return Math.random().toString(36).slice(2)
}

function blankField(sortOrder: number): DraftField {
  return {
    _key: makeKey(),
    name: '',
    slug: '',
    type: 'text',
    required: false,
    multiple: false,
    sortOrder,
    options: null,
  }
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function FieldTypeOptions({ field, onChange }: {
  field: DraftField
  onChange: (patch: Partial<DraftField>) => void
}) {
  if (field.type === 'select') {
    const choices: string[] = (field.options?.choices as string[]) ?? []
    return (
      <div className="space-y-2">
        <label className="text-xs text-stone-500 uppercase tracking-widest">Choices</label>
        {choices.map((c, i) => (
          <div key={i} className="flex gap-2">
            <input
              type="text"
              value={c}
              onChange={(e) => {
                const next = [...choices]
                next[i] = e.target.value
                onChange({ options: { choices: next } })
              }}
              className="flex-1 rounded-lg border border-stone-700 bg-stone-800 px-3 py-1.5 text-sm text-stone-100 outline-none focus:border-amber-500/50"
              placeholder={`Choice ${i + 1}`}
            />
            <button
              type="button"
              onClick={() => onChange({ options: { choices: choices.filter((_, j) => j !== i) } })}
              className="text-stone-600 hover:text-red-400 transition-colors px-1"
            >
              <svg viewBox="0 0 16 16" fill="none" className="w-4 h-4"><path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => onChange({ options: { choices: [...choices, ''] } })}
          className="text-xs text-amber-400 hover:text-amber-300 transition-colors"
        >
          + Add choice
        </button>
      </div>
    )
  }

  if (field.type === 'number') {
    const opts = (field.options ?? {}) as { min?: number; max?: number; step?: number }
    return (
      <div className="grid grid-cols-3 gap-3">
        {(['min', 'max', 'step'] as const).map((k) => (
          <div key={k} className="space-y-1">
            <label className="text-xs text-stone-500 uppercase tracking-widest">{k}</label>
            <input
              type="number"
              value={opts[k] ?? ''}
              onChange={(e) => onChange({ options: { ...opts, [k]: e.target.value ? Number(e.target.value) : undefined } })}
              className="w-full rounded-lg border border-stone-700 bg-stone-800 px-3 py-1.5 text-sm text-stone-100 outline-none focus:border-amber-500/50"
              placeholder="—"
            />
          </div>
        ))}
      </div>
    )
  }

  return null
}

function FieldRow({
  field,
  index,
  total,
  onMove,
  onChange,
  onDelete,
}: {
  field: DraftField
  index: number
  total: number
  onMove: (from: number, to: number) => void
  onChange: (key: string, patch: Partial<DraftField>) => void
  onDelete: (key: string) => void
}) {
  const [expanded, setExpanded] = useState(!field.id)
  const slugManual = useState(!!field.id)[0]
  const slugManualRef = { current: slugManual }

  const inputCls = 'w-full rounded-lg border border-stone-700 bg-stone-800 px-3 py-2 text-sm text-stone-100 outline-none focus:border-amber-500/50 transition-colors'

  return (
    <div className="rounded-xl border border-stone-700 bg-stone-900/80">
      {/* Row header */}
      <div className="flex items-center gap-3 px-4 py-3">
        {/* Drag handle / reorder */}
        <div className="flex flex-col gap-0.5 shrink-0">
          <button
            type="button"
            disabled={index === 0}
            onClick={() => onMove(index, index - 1)}
            className="text-stone-600 hover:text-stone-300 disabled:opacity-20 transition-colors"
            aria-label="Move up"
          >
            <svg viewBox="0 0 12 12" fill="none" className="w-3 h-3"><path d="M6 9V3M3 6l3-3 3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
          <button
            type="button"
            disabled={index === total - 1}
            onClick={() => onMove(index, index + 1)}
            className="text-stone-600 hover:text-stone-300 disabled:opacity-20 transition-colors"
            aria-label="Move down"
          >
            <svg viewBox="0 0 12 12" fill="none" className="w-3 h-3"><path d="M6 3v6M3 6l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
        </div>

        {/* Type badge */}
        <span className="shrink-0 rounded-md bg-stone-800 border border-stone-700 px-2 py-0.5 text-xs text-stone-400 font-mono">
          {field.type}
        </span>

        {/* Name (inline) */}
        <input
          type="text"
          value={field.name}
          onChange={(e) => {
            const name = e.target.value
            const patch: Partial<DraftField> = { name }
            if (!slugManualRef.current && !field.id) {
              patch.slug = slugify(name)
            }
            onChange(field._key, patch)
          }}
          placeholder="Field name"
          className="flex-1 bg-transparent text-sm text-stone-100 outline-none placeholder:text-stone-600"
        />

        {field.required && (
          <span className="shrink-0 text-xs text-red-400">required</span>
        )}

        <button
          type="button"
          onClick={() => setExpanded((x) => !x)}
          className="shrink-0 text-stone-600 hover:text-stone-300 transition-colors"
          aria-label={expanded ? 'Collapse' : 'Expand'}
        >
          <svg viewBox="0 0 16 16" fill="none" className={`w-4 h-4 transition-transform ${expanded ? 'rotate-180' : ''}`}>
            <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>

        <button
          type="button"
          onClick={() => onDelete(field._key)}
          className="shrink-0 text-stone-600 hover:text-red-400 transition-colors"
          aria-label="Delete field"
        >
          <svg viewBox="0 0 16 16" fill="none" className="w-4 h-4">
            <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </button>
      </div>

      {/* Expanded settings */}
      {expanded && (
        <div className="border-t border-stone-700/60 px-4 py-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Slug */}
            <div className="space-y-1.5">
              <label className="text-xs text-stone-500 uppercase tracking-widest">Slug</label>
              <input
                type="text"
                value={field.slug}
                onChange={(e) => onChange(field._key, { slug: e.target.value })}
                placeholder="field_slug"
                className={inputCls + ' font-mono'}
              />
            </div>

            {/* Type */}
            <div className="space-y-1.5">
              <label className="text-xs text-stone-500 uppercase tracking-widest">Type</label>
              <select
                value={field.type}
                onChange={(e) => onChange(field._key, { type: e.target.value as FieldType, options: null })}
                className={inputCls + ' cursor-pointer'}
              >
                {FIELD_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label} — {t.hint}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Flags */}
          <div className="flex flex-wrap gap-6">
            <label className="flex items-center gap-2 cursor-pointer text-sm text-stone-300 select-none">
              <input
                type="checkbox"
                checked={field.required}
                onChange={(e) => onChange(field._key, { required: e.target.checked })}
                className="w-4 h-4 rounded border-stone-700 bg-stone-800 accent-amber-500"
              />
              Required
            </label>
            <label className="flex items-center gap-2 cursor-pointer text-sm text-stone-300 select-none">
              <input
                type="checkbox"
                checked={field.multiple}
                onChange={(e) => onChange(field._key, { multiple: e.target.checked })}
                className="w-4 h-4 rounded border-stone-700 bg-stone-800 accent-amber-500"
              />
              Allow multiple
            </label>
          </div>

          {/* Type-specific options */}
          <FieldTypeOptions
            field={field}
            onChange={(patch) => onChange(field._key, patch)}
          />
        </div>
      )}
    </div>
  )
}

// ─── SchemaBuilder ─────────────────────────────────────────────────────────────

type Props = {
  collectionId: string
  initialFields: Field[]
}

export function SchemaBuilder({ collectionId, initialFields }: Props) {
  const formId = useId()

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
  )

  const [deletedIds, setDeletedIds] = useState<string[]>([])

  const [state, formAction, pending] = useActionState<FieldsFormState, FormData>(
    upsertFields,
    undefined,
  )

  const handleAdd = useCallback(() => {
    setDraftFields((prev) => [...prev, blankField(prev.length)])
  }, [])

  const handleMove = useCallback((from: number, to: number) => {
    setDraftFields((prev) => {
      const next = [...prev]
      const [item] = next.splice(from, 1)
      next.splice(to, 0, item)
      return next.map((f, i) => ({ ...f, sortOrder: i }))
    })
  }, [])

  const handleChange = useCallback((key: string, patch: Partial<DraftField>) => {
    setDraftFields((prev) =>
      prev.map((f) => (f._key === key ? { ...f, ...patch } : f)),
    )
  }, [])

  const handleDelete = useCallback((key: string) => {
    setDraftFields((prev) => {
      const field = prev.find((f) => f._key === key)
      if (field?.id) setDeletedIds((d) => [...d, field.id!])
      return prev.filter((f) => f._key !== key)
    })
  }, [])

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
    })
  }

  return (
    <div className="space-y-4">
      {state?.errors?.general?.map((msg) => (
        <p key={msg} className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-2">
          {msg}
        </p>
      ))}
      {state?.message && (
        <p className="text-sm text-green-400 bg-green-500/10 border border-green-500/20 rounded-lg px-4 py-2">
          {state.message}
        </p>
      )}

      {/* Field list */}
      <div className="space-y-2">
        {draftFields.length === 0 ? (
          <div className="rounded-xl border border-stone-800 border-dashed px-6 py-10 text-center">
            <p className="text-sm text-stone-600">No fields yet — add one below.</p>
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
      <div className="flex items-center gap-3 pt-2">
        <button
          type="button"
          onClick={handleAdd}
          className="inline-flex items-center gap-2 rounded-lg border border-stone-700 bg-stone-800 px-4 py-2 text-sm text-stone-300 hover:bg-stone-700 hover:text-stone-100 transition-colors"
        >
          <svg viewBox="0 0 16 16" fill="none" className="w-4 h-4" aria-hidden="true">
            <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          Add field
        </button>

        <form
          id={formId}
          action={formAction}
          onSubmit={(e) => {
            // Inject the serialised payload before submission
            const input = e.currentTarget.querySelector<HTMLInputElement>('[name="fieldsPayload"]')!
            input.value = buildPayload()
          }}
          className="flex-1 flex justify-end"
        >
          <input type="hidden" name="fieldsPayload" defaultValue="" />
          <button
            type="submit"
            disabled={pending}
            className="rounded-lg bg-amber-500 px-5 py-2 text-sm font-semibold text-stone-950 hover:bg-amber-400 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {pending ? 'Saving…' : 'Save fields'}
          </button>
        </form>
      </div>
    </div>
  )
}
