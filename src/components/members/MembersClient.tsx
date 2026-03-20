"use client";

import { useActionState, useTransition, useState } from "react";
import {
  addMember,
  updateMemberRole,
  removeMember,
} from "@/lib/actions/members";
import { cn } from "@/lib/utils";
import type { MemberFormState, MemberRow } from "@/lib/actions/members";
import type { MemberRole } from "@/lib/db/schema";

const roleBadge = {
  owner:
    "bg-[rgba(232,160,48,0.08)] border-[rgba(232,160,48,0.25)] text-cms-accent",
  editor:
    "bg-[rgba(29,158,117,0.08)] border-[rgba(29,158,117,0.25)] text-[#1D9E75]",
  viewer:
    "bg-[rgba(90,88,85,0.15)] border-[rgba(90,88,85,0.3)] text-cms-text-3",
};

function MemberRow({
  member,
  onRemoved,
  onRoleChange,
}: {
  member: MemberRow;
  onRemoved: (id: string) => void;
  onRoleChange: (id: string, role: MemberRole) => void;
}) {
  const [removing, startRemove] = useTransition();
  const [updatingRole, startUpdate] = useTransition();
  const isOwner = member.role === "owner";

  return (
    <div
      className="grid items-center gap-3 px-3.5 py-2.5 rounded-cms border border-cms-border bg-cms-surface"
      style={{ gridTemplateColumns: "1fr 120px 80px" }}
    >
      <div className="min-w-0">
        {member.displayName && (
          <p className="font-mono text-xs text-cms-text truncate">
            {member.displayName}
          </p>
        )}
        <p className="font-mono text-sm text-cms-text-3 truncate">
          {member.email}
        </p>
      </div>

      <div>
        {isOwner ? (
          <span
            className={cn(
              "font-mono text-xs px-1.5 py-0.5 rounded border",
              roleBadge.owner,
            )}
          >
            owner
          </span>
        ) : (
          <select
            value={member.role}
            disabled={updatingRole}
            onChange={(e) => {
              const role = e.target.value as MemberRole;
              startUpdate(async () => {
                await updateMemberRole(member.id, role);
                onRoleChange(member.id, role);
              });
            }}
            className="font-mono text-sm px-2 py-0.5 rounded-cms border border-cms-border bg-cms-surface-2 text-cms-text-2 outline-none cursor-pointer disabled:opacity-60"
          >
            <option value="editor">editor</option>
            <option value="viewer">viewer</option>
          </select>
        )}
      </div>

      <div className="flex justify-end">
        {!isOwner && (
          <button
            onClick={() =>
              startRemove(async () => {
                await removeMember(member.id);
                onRemoved(member.id);
              })
            }
            disabled={removing}
            className="font-mono text-sm text-cms-text-3 hover:text-cms-danger transition-colors disabled:opacity-60 cursor-pointer"
          >
            {removing ? "…" : "Remove"}
          </button>
        )}
      </div>
    </div>
  );
}

const inputCls = cn(
  "w-full font-mono text-xs px-2.5 py-1.5 rounded-cms border border-cms-border",
  "bg-cms-surface-2 text-cms-text outline-none focus:border-[rgba(232,160,48,0.5)] transition-colors",
);

export function MembersClient({
  collectionId,
  initialMembers,
}: {
  collectionId: string;
  initialMembers: MemberRow[];
}) {
  const [members, setMembers] = useState<MemberRow[]>(initialMembers);
  const [state, formAction, pending] = useActionState<
    MemberFormState,
    FormData
  >(addMember, undefined);

  function handleRemoved(id: string) {
    setMembers((prev) => prev.filter((m) => m.id !== id));
  }

  function handleRoleChange(id: string, role: MemberRole) {
    setMembers((prev) => prev.map((m) => (m.id === id ? { ...m, role } : m)));
  }

  return (
    <div className="space-y-6">
      {/* Member list */}
      <div className="flex flex-col gap-0.5">
        <div
          className="grid gap-3 px-3.5 py-1.5 font-mono text-xs tracking-[0.07em] uppercase text-cms-text-3"
          style={{ gridTemplateColumns: "1fr 120px 80px" }}
        >
          <span>User</span>
          <span>Role</span>
          <span />
        </div>
        {members.map((m) => (
          <MemberRow
            key={m.id}
            member={m}
            onRemoved={handleRemoved}
            onRoleChange={handleRoleChange}
          />
        ))}
      </div>

      {/* Add member */}
      <div className="rounded-cms-lg border border-cms-border bg-cms-surface p-5">
        <p className="font-mono text-xs tracking-widest uppercase text-cms-text-3 mb-4">
          Add member
        </p>
        <form action={formAction} className="space-y-3">
          <input type="hidden" name="collectionId" value={collectionId} />

          {state?.errors?.general?.map((msg) => (
            <p
              key={msg}
              className="font-mono text-xs text-cms-danger bg-[rgba(224,80,80,0.08)] border border-cms-danger-border rounded-cms px-3 py-2"
            >
              {msg}
            </p>
          ))}
          {state?.message && (
            <p className="font-mono text-xs text-[#50c878] bg-cms-success-subtle border border-cms-success-border rounded-cms px-3 py-2">
              {state.message}
            </p>
          )}

          <div className="grid grid-cols-[1fr_120px] gap-3 items-end">
            <div className="space-y-1.5">
              <label className="font-mono text-xs tracking-[0.08em] uppercase text-cms-text-3 block">
                Email
              </label>
              <input
                name="email"
                type="email"
                required
                placeholder="collaborator@example.com"
                className={cn(
                  inputCls,
                  state?.errors?.email && "border-[rgba(224,80,80,0.5)]",
                )}
              />
              {state?.errors?.email?.map((e) => (
                <p key={e} className="font-mono text-xs text-cms-danger">
                  {e}
                </p>
              ))}
            </div>
            <div className="space-y-1.5">
              <label className="font-mono text-xs tracking-[0.08em] uppercase text-cms-text-3 block">
                Role
              </label>
              <select
                name="role"
                defaultValue="editor"
                className={cn(inputCls, "cursor-pointer")}
              >
                <option value="editor">Editor</option>
                <option value="viewer">Viewer</option>
              </select>
            </div>
          </div>

          <p className="font-mono text-xs text-cms-text-3">
            The person must already have a pwk-cms account.
          </p>

          <button
            type="submit"
            disabled={pending}
            className="px-4 py-1.5 rounded-cms bg-cms-accent text-cms-accent-text font-mono text-xs font-medium border-none cursor-pointer disabled:opacity-60"
          >
            {pending ? "Adding…" : "Add member"}
          </button>
        </form>
      </div>
    </div>
  );
}
