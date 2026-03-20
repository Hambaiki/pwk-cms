"use client";

import { useTransition, useState } from "react";
import { revokeApiKey } from "@/lib/actions/apiKeys";
import { cn } from "@/lib/utils";
import type { ApiKeyRow } from "@/lib/actions/apiKeys";

function fmt(date: Date | null) {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function ScopeTag({ scope }: { scope: "public" | "private" }) {
  return scope === "public" ? (
    <span className="font-mono text-[10px] px-1.5 py-0.5 rounded border bg-[rgba(29,158,117,0.08)] border-[rgba(29,158,117,0.3)] text-[#1D9E75]">
      public
    </span>
  ) : (
    <span className="font-mono text-[10px] px-1.5 py-0.5 rounded border bg-[rgba(83,74,183,0.1)] border-[rgba(83,74,183,0.3)] text-[#7F77DD]">
      private
    </span>
  );
}

function RevokeButton({ id }: { id: string }) {
  const [isPending, startTransition] = useTransition();
  const [confirming, setConfirming] = useState(false);

  const baseBtnCls =
    "px-2.5 py-1 rounded border font-mono text-[11px] cursor-pointer";

  if (confirming) {
    return (
      <div className="flex items-center gap-1.5">
        <span className="font-mono text-[11px] text-cms-text-3">Revoke?</span>
        <button
          onClick={() => startTransition(() => revokeApiKey(id))}
          disabled={isPending}
          className={cn(
            baseBtnCls,
            "border-[rgba(224,80,80,0.35)] bg-cms-danger-dim text-cms-danger disabled:opacity-60",
          )}
        >
          {isPending ? "…" : "Yes"}
        </button>
        <button
          onClick={() => setConfirming(false)}
          className={cn(
            baseBtnCls,
            "border-cms-border bg-transparent text-cms-text-3",
          )}
        >
          No
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className={cn(
        baseBtnCls,
        "border-cms-border bg-transparent text-cms-text-3 hover:text-cms-danger hover:border-[rgba(224,80,80,0.35)] transition-colors",
      )}
    >
      Revoke
    </button>
  );
}

export function ApiKeyList({ keys }: { keys: ApiKeyRow[] }) {
  if (keys.length === 0) {
    return (
      <div className="rounded-cms-lg border border-dashed border-cms-border px-6 py-8 text-center">
        <p className="font-mono text-xs text-cms-text-3">
          No API keys yet — generate one below.
        </p>
      </div>
    );
  }

  const colCls =
    "grid gap-3 px-3.5 font-mono text-[10px] tracking-[0.07em] uppercase text-cms-text-3";
  const cols = { gridTemplateColumns: "1fr 80px 110px 110px 80px" };

  return (
    <div className="flex flex-col gap-0.5">
      <div className={cn(colCls, "py-1.5")} style={cols}>
        <span>Name</span>
        <span>Scope</span>
        <span>Created</span>
        <span>Last used</span>
        <span />
      </div>

      {keys.map((key) => {
        const isRevoked = !!key.revokedAt;
        const isExpired = key.expiresAt
          ? new Date(key.expiresAt) < new Date()
          : false;
        const isInactive = isRevoked || isExpired;

        return (
          <div
            key={key.id}
            className={cn(
              "grid items-center gap-3 px-3.5 py-2.5 rounded-cms border border-cms-border transition-opacity",
              isInactive ? "opacity-40 bg-transparent" : "bg-cms-surface",
            )}
            style={cols}
          >
            <div className="flex items-center gap-2 min-w-0">
              <span className="font-mono text-xs text-cms-text overflow-hidden text-ellipsis whitespace-nowrap">
                {key.name}
              </span>
              {isRevoked && (
                <span className="font-mono text-[10px] px-1.5 py-0.5 rounded border shrink-0 bg-[rgba(224,80,80,0.08)] border-cms-danger-border text-cms-danger">
                  revoked
                </span>
              )}
              {!isRevoked && isExpired && (
                <span className="font-mono text-[10px] px-1.5 py-0.5 rounded border shrink-0 bg-[rgba(186,117,23,0.08)] border-[rgba(186,117,23,0.2)] text-[#BA7517]">
                  expired
                </span>
              )}
            </div>
            <ScopeTag scope={key.scope} />
            <span className="font-mono text-[11px] text-cms-text-3">
              {fmt(key.createdAt)}
            </span>
            <span className="font-mono text-[11px] text-cms-text-3">
              {fmt(key.lastUsedAt)}
            </span>
            <div className="flex justify-end">
              {!isInactive && <RevokeButton id={key.id} />}
            </div>
          </div>
        );
      })}
    </div>
  );
}
