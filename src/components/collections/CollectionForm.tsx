'use client'

import { useActionState, useEffect, useRef } from 'react'
import { createCollection, updateCollection } from '@/lib/actions/collections'
import type { CollectionFormState } from '@/lib/actions/collections'
import type { Collection } from '@/lib/db/schema'

type Props =
  | { mode: 'create' }
  | { mode: 'edit'; collection: Collection }

function slugify(value: string) {
  return value.toLowerCase().trim()
    .replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-').replace(/^-+|-+$/g, '')
}

export function CollectionForm(props: Props) {
  const isEdit = props.mode === 'edit'
  const collection = isEdit ? props.collection : undefined

  const action = isEdit
    ? updateCollection.bind(null, collection!.id)
    : createCollection

  const [state, formAction, pending] = useActionState<CollectionFormState, FormData>(
    action,
    undefined,
  )

  const nameRef = useRef<HTMLInputElement>(null)
  const slugRef = useRef<HTMLInputElement>(null)
  const slugManuallyEdited = useRef(false)

  useEffect(() => {
    if (!isEdit) {
      nameRef.current?.focus()
    }
  }, [isEdit])

  function handleNameChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (!slugManuallyEdited.current && slugRef.current) {
      slugRef.current.value = slugify(e.target.value)
    }
  }

  function handleSlugChange() {
    slugManuallyEdited.current = true
  }

  const inputCls = (hasError?: boolean) =>
    [
      'w-full rounded-lg border bg-stone-800 px-3 py-2 text-sm text-stone-100',
      'placeholder:text-stone-600 outline-none transition-all duration-150',
      'focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50',
      hasError ? 'border-red-500/60' : 'border-stone-700 hover:border-stone-500',
    ].join(' ')

  return (
    <form action={formAction} className="space-y-5">
      {state?.errors?.general?.map((msg) => (
        <p key={msg} className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-2">{msg}</p>
      ))}

      {state?.message && (
        <p className="text-sm text-green-400 bg-green-500/10 border border-green-500/20 rounded-lg px-4 py-2">{state.message}</p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {/* Name */}
        <div className="space-y-1.5">
          <label htmlFor="col-name" className="text-xs font-semibold uppercase tracking-widest text-stone-400">
            Name
          </label>
          <input
            ref={nameRef}
            id="col-name"
            name="name"
            type="text"
            placeholder="Blog Post"
            defaultValue={collection?.name}
            onChange={handleNameChange}
            className={inputCls(!!state?.errors?.name)}
          />
          {state?.errors?.name?.map((e) => (
            <p key={e} className="text-xs text-red-400">{e}</p>
          ))}
        </div>

        {/* Icon */}
        <div className="space-y-1.5">
          <label htmlFor="col-icon" className="text-xs font-semibold uppercase tracking-widest text-stone-400">
            Icon <span className="text-stone-600 normal-case font-normal">(emoji)</span>
          </label>
          <input
            id="col-icon"
            name="icon"
            type="text"
            placeholder="📝"
            defaultValue={collection?.icon ?? ''}
            maxLength={2}
            className={inputCls()}
          />
        </div>
      </div>

      {/* Slug */}
      <div className="space-y-1.5">
        <label htmlFor="col-slug" className="text-xs font-semibold uppercase tracking-widest text-stone-400">
          Slug <span className="text-stone-600 normal-case font-normal">(used in API routes)</span>
        </label>
        <div className="flex items-center gap-0">
          <span className="rounded-l-lg border border-r-0 border-stone-700 bg-stone-700/50 px-3 py-2 text-xs text-stone-500 font-mono whitespace-nowrap">
            /api/v1/
          </span>
          <input
            ref={slugRef}
            id="col-slug"
            name="slug"
            type="text"
            placeholder="blog-post"
            defaultValue={collection?.slug}
            onChange={handleSlugChange}
            className={[inputCls(!!state?.errors?.slug), 'rounded-l-none'].join(' ')}
          />
        </div>
        {state?.errors?.slug?.map((e) => (
          <p key={e} className="text-xs text-red-400">{e}</p>
        ))}
      </div>

      {/* Description */}
      <div className="space-y-1.5">
        <label htmlFor="col-description" className="text-xs font-semibold uppercase tracking-widest text-stone-400">
          Description <span className="text-stone-600 normal-case font-normal">(optional)</span>
        </label>
        <textarea
          id="col-description"
          name="description"
          rows={2}
          placeholder="A short description of this content type"
          defaultValue={collection?.description ?? ''}
          className={[inputCls(), 'resize-none'].join(' ')}
        />
      </div>

      {/* isPage toggle */}
      <label className="flex items-center gap-3 cursor-pointer select-none">
        <input
          type="checkbox"
          name="isPage"
          value="true"
          defaultChecked={collection?.isPage ?? false}
          className="w-4 h-4 rounded border-stone-700 bg-stone-800 accent-amber-500"
        />
        <span className="text-sm text-stone-300">Single instance (page)</span>
        <span className="text-xs text-stone-600">— only one entry allowed</span>
      </label>

      <div className="pt-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-amber-500 px-5 py-2 text-sm font-semibold text-stone-950 hover:bg-amber-400 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {pending ? 'Saving…' : isEdit ? 'Save changes' : 'Create collection'}
        </button>
      </div>
    </form>
  )
}
