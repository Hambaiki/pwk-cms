"use client";

import { useActionState, useState, useRef } from "react";
import { createApiKey } from "@/lib/actions/apiKeys";
import { cn } from "@/lib/utils";
import type { CreateKeyState } from "@/lib/actions/apiKeys";

function KeyReveal({
  rawKey,
  name,
  scope,
  onDismiss,
}: {
  rawKey: string;
  name: string;
  scope: "public" | "private";
  onDismiss: () => void;
}) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(rawKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="rounded-cms-lg border border-[rgba(232,160,48,0.3)] bg-cms-accent-subtle p-5 mb-6">
      <div className="flex items-start gap-2.5 mb-4">
        <svg
          viewBox="0 0 16 16"
          fill="none"
          width="16"
          height="16"
          className="shrink-0 mt-px text-cms-accent"
        >
          <path
            d="M8 1L15 14H1L8 1z"
            stroke="currentColor"
            strokeWidth="1.2"
            strokeLinejoin="round"
          />
          <path
            d="M8 6v4M8 11.5v.5"
            stroke="currentColor"
            strokeWidth="1.2"
            strokeLinecap="round"
          />
        </svg>
        <div>
          <p className="font-mono text-xs font-medium text-cms-accent mb-1">
            Copy this key now
          </p>
          <p className="font-mono text-[11px] text-cms-text-3 leading-relaxed">
            <strong className="text-cms-text-2">{name}</strong> ({scope}) was
            created. This is the only time the full key will be shown.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-cms border border-cms-border-2 bg-cms-bg mb-3.5">
        <code className="flex-1 font-mono text-[11px] text-cms-text break-all leading-relaxed">
          {rawKey}
        </code>
        <button
          onClick={handleCopy}
          className={cn(
            "shrink-0 px-3 py-1 rounded-cms border font-mono text-[11px] cursor-pointer transition-all",
            copied
              ? "border-[rgba(29,158,117,0.3)] bg-[rgba(29,158,117,0.1)] text-[#1D9E75]"
              : "border-cms-border-2 bg-cms-surface-2 text-cms-text-2 hover:border-cms-accent",
          )}
        >
          {copied ? "✓ Copied" : "Copy"}
        </button>
      </div>

      <button
        onClick={onDismiss}
        className="font-mono text-[11px] text-cms-text-3 bg-none border-none cursor-pointer underline underline-offset-2 p-0"
      >
        I've saved it, dismiss
      </button>
    </div>
  );
}

const inputCls = cn(
  "w-full font-mono text-xs px-2.5 py-1.5 rounded-cms border border-cms-border",
  "bg-cms-surface-2 text-cms-text outline-none focus:border-[rgba(232,160,48,0.5)] transition-colors",
);

export function CreateKeyForm({ collectionId }: { collectionId: string }) {
  const [state, formAction, pending] = useActionState<CreateKeyState, FormData>(
    createApiKey,
    undefined,
  );
  const [dismissed, setDismissed] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  function handleDismiss() {
    setDismissed(true);
    formRef.current?.reset();
  }

  const showReveal = state?.created && !dismissed;

  return (
    <div>
      {showReveal && (
        <KeyReveal
          rawKey={state.created!.rawKey}
          name={state.created!.name}
          scope={state.created!.scope}
          onDismiss={handleDismiss}
        />
      )}

      <form ref={formRef} action={formAction} className="space-y-3.5">
        <input type="hidden" name="collectionId" value={collectionId} />
        {state?.errors?.general?.map((msg) => (
          <p
            key={msg}
            className="font-mono text-xs text-cms-danger bg-[rgba(224,80,80,0.08)] border border-cms-danger-border rounded-cms px-3 py-2"
          >
            {msg}
          </p>
        ))}

        <div className="grid grid-cols-[1fr_130px] gap-3.5 items-end">
          <div className="space-y-1.5">
            <label className="font-mono text-[10px] tracking-[0.08em] uppercase text-cms-text-3 block">
              Key name
            </label>
            <input
              name="name"
              type="text"
              placeholder="My website — public"
              required
              className={cn(
                inputCls,
                state?.errors?.name && "border-[rgba(224,80,80,0.5)]",
              )}
            />
            {state?.errors?.name?.map((e) => (
              <p key={e} className="font-mono text-[10px] text-cms-danger">
                {e}
              </p>
            ))}
          </div>
          <div className="space-y-1.5">
            <label className="font-mono text-[10px] tracking-[0.08em] uppercase text-cms-text-3 block">
              Scope
            </label>
            <select
              name="scope"
              defaultValue="public"
              className={cn(inputCls, "cursor-pointer")}
            >
              <option value="public">Public</option>
              <option value="private">Private</option>
            </select>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="font-mono text-[10px] tracking-[0.08em] uppercase text-cms-text-3 block">
            Expires{" "}
            <span className="text-cms-text-3 normal-case tracking-normal font-normal">
              (optional)
            </span>
          </label>
          <input
            name="expiresAt"
            type="date"
            min={new Date().toISOString().slice(0, 10)}
            className={cn(inputCls, "w-auto")}
          />
        </div>

        <div className="pt-1">
          <button
            type="submit"
            disabled={pending}
            className="px-5 py-2 rounded-cms bg-cms-accent text-cms-accent-text font-mono text-xs font-medium border-none cursor-pointer transition-opacity disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {pending ? "Generating…" : "Generate key"}
          </button>
        </div>
      </form>
    </div>
  );
}
