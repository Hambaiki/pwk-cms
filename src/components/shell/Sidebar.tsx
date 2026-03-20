import Link from "next/link";
import { getCollections } from "@/lib/actions/collections";
import { getOptionalSession } from "@/lib/dal";
import { NavLinks } from "./NavLinks";

export async function Sidebar() {
  const [collections, session] = await Promise.all([
    getCollections(),
    getOptionalSession(),
  ]);

  return (
    <aside
      className="w-55 shrink-0 h-screen flex flex-col bg-cms-surface border-r border-cms-border overflow-hidden"
      style={{
        backgroundImage:
          "radial-gradient(circle, rgba(255,255,255,0.03) 1px, transparent 1px)",
        backgroundSize: "20px 20px",
        backgroundColor: "var(--color-cms-surface)",
      }}
    >
      {/* Brand */}
      <div className="flex items-center gap-2.5 px-4 pt-4.5 pb-3.5 border-b border-cms-border shrink-0">
        <div className="text-cms-accent" aria-hidden="true">
          <svg viewBox="0 0 20 20" fill="none" width="16" height="16">
            <rect
              x="2"
              y="2"
              width="7"
              height="7"
              rx="1.5"
              fill="currentColor"
              opacity="1"
            />
            <rect
              x="11"
              y="2"
              width="7"
              height="7"
              rx="1.5"
              fill="currentColor"
              opacity="0.5"
            />
            <rect
              x="2"
              y="11"
              width="7"
              height="7"
              rx="1.5"
              fill="currentColor"
              opacity="0.5"
            />
            <rect
              x="11"
              y="11"
              width="7"
              height="7"
              rx="1.5"
              fill="currentColor"
              opacity="0.25"
            />
          </svg>
        </div>
        <span className="font-mono text-[13px] font-medium text-cms-text tracking-tight">
          pwk<span className="text-cms-accent">cms</span>
        </span>
      </div>

      {/* Nav */}
      <NavLinks collections={collections} session={session} />

      {/* User footer */}
      {session && (
        <div className="flex items-center gap-2.5 px-3.5 py-3 border-t border-cms-border shrink-0">
          <div
            className="w-6.5 h-6.5 rounded-md bg-cms-accent-dim border border-cms-accent-border text-cms-accent font-mono text-[11px] font-medium flex items-center justify-center shrink-0"
            aria-hidden="true"
          >
            {(session.email?.[0] ?? "?").toUpperCase()}
          </div>
          <div className="min-w-0">
            <span className="font-mono text-[11px] text-cms-text-3 overflow-hidden text-ellipsis whitespace-nowrap block">
              {session.email}
            </span>
          </div>
        </div>
      )}
    </aside>
  );
}
