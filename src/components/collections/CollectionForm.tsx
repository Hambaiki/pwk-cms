"use client";

import { cn } from "@/lib/utils";
import { useActionState, useEffect, useRef } from "react";
import { createCollection, updateCollection } from "@/lib/actions/collections";
import type { CollectionFormState } from "@/lib/actions/collections";
import type { Collection } from "@/lib/db/schema";

type Props = { mode: "create" } | { mode: "edit"; collection: Collection };

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// ─── Shared input class ────────────────────────────────────────────────────────

const baseInput =
  "w-full font-mono text-sm px-2.5 py-1.5 rounded-cms border bg-cms-surface-2 text-cms-text placeholder:text-cms-text-3 outline-none transition-colors";
const inputCls = (hasError?: boolean) =>
  cn(
    baseInput,
    hasError
      ? "border-cms-danger-border focus:border-cms-danger"
      : "border-cms-border hover:border-cms-border-2 focus:border-cms-accent",
  );

export function CollectionForm(props: Props) {
  const isEdit = props.mode === "edit";
  const collection = isEdit ? props.collection : undefined;

  const action = isEdit
    ? updateCollection.bind(null, collection!.id)
    : createCollection;

  const [state, formAction, pending] = useActionState<
    CollectionFormState,
    FormData
  >(action, undefined);

  const nameRef = useRef<HTMLInputElement>(null);
  const slugRef = useRef<HTMLInputElement>(null);
  const slugManuallyEdited = useRef(false);

  useEffect(() => {
    if (!isEdit) nameRef.current?.focus();
  }, [isEdit]);

  function handleNameChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (!slugManuallyEdited.current && slugRef.current) {
      slugRef.current.value = slugify(e.target.value);
    }
  }

  const labelCls =
    "font-mono text-xs tracking-[0.08em] uppercase text-cms-text-3 block mb-1.5";
  const hintCls = "normal-case tracking-normal font-normal text-cms-text-3";

  return (
    <form action={formAction} className="space-y-5">
      {/* General errors */}
      {state?.errors?.general?.map((msg) => (
        <p
          key={msg}
          className="font-mono text-sm text-cms-danger bg-cms-danger-dim border border-cms-danger-border rounded-cms px-3 py-2"
        >
          {msg}
        </p>
      ))}

      {/* Success message */}
      {state?.message && (
        <p className="font-mono text-sm text-cms-success bg-cms-success-subtle border border-cms-success-border rounded-cms px-3 py-2">
          {state.message}
        </p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {/* Name */}
        <div>
          <label htmlFor="col-name" className={labelCls}>
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
            <p key={e} className="font-mono text-sm text-cms-danger mt-1">
              {e}
            </p>
          ))}
        </div>

        {/* Icon */}
        <div>
          <label htmlFor="col-icon" className={labelCls}>
            Icon <span className={hintCls}>(emoji)</span>
          </label>
          <input
            id="col-icon"
            name="icon"
            type="text"
            placeholder="📝"
            defaultValue={collection?.icon ?? ""}
            maxLength={2}
            className={inputCls()}
          />
        </div>
      </div>

      {/* Slug */}
      <div>
        <label htmlFor="col-slug" className={labelCls}>
          Slug <span className={hintCls}>(used in API routes)</span>
        </label>
        <div className="flex items-center">
          <span className="font-mono text-sm text-cms-text-3 bg-cms-surface-3 border border-r-0 border-cms-border px-2.5 py-1.5 rounded-l-cms whitespace-nowrap">
            /api/v1/
          </span>
          <input
            ref={slugRef}
            id="col-slug"
            name="slug"
            type="text"
            placeholder="blog-post"
            defaultValue={collection?.slug}
            onChange={() => {
              slugManuallyEdited.current = true;
            }}
            className={cn(inputCls(!!state?.errors?.slug), "rounded-l-none")}
          />
        </div>
        {state?.errors?.slug?.map((e) => (
          <p key={e} className="font-mono text-sm text-cms-danger mt-1">
            {e}
          </p>
        ))}
      </div>

      {/* Description */}
      <div>
        <label htmlFor="col-description" className={labelCls}>
          Description <span className={hintCls}>(optional)</span>
        </label>
        <textarea
          id="col-description"
          name="description"
          rows={2}
          placeholder="A short description of this content type"
          defaultValue={collection?.description ?? ""}
          className={cn(inputCls(), "resize-none")}
        />
      </div>

      {/* isPage toggle */}
      <label className="flex items-center gap-3 cursor-pointer select-none">
        <input
          type="checkbox"
          name="isPage"
          value="true"
          defaultChecked={collection?.isPage ?? false}
          className="w-4 h-4 rounded accent-cms-accent border-cms-border bg-cms-surface-2"
        />
        <span className="font-mono text-sm text-cms-text-2">
          Single instance (page)
        </span>
        <span className="font-mono text-sm text-cms-text-3">
          — only one entry allowed
        </span>
      </label>

      <div className="pt-1">
        <button
          type="submit"
          disabled={pending}
          className={cn(
            "px-5 py-2 rounded-cms font-mono text-sm font-medium transition-all duration-200",
            "bg-cms-accent text-cms-accent-text shadow-sm",
            "hover:brightness-110 hover:shadow-md active:scale-[0.98]",
            "disabled:opacity-60 disabled:cursor-not-allowed disabled:scale-100",
          )}
        >
          {pending ? "Saving…" : isEdit ? "Save changes" : "Create collection"}
        </button>
      </div>
    </form>
  );
}
