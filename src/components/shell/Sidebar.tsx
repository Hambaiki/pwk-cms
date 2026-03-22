import Link from "next/link";
import { getCollections } from "@/lib/actions/collections";
import { getOptionalSession } from "@/lib/dal";
import { NavLinks } from "./NavLinks";
import { BrandIcon } from "@/components/BrandIcon";

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
      <div className="flex items-center gap-2.5 p-4 h-14 border-b border-cms-border shrink-0">
        <BrandIcon size={20} withText={false} />
        <span className="font-mono text-base font-medium text-cms-text tracking-tight">
          pwk<span className="text-cms-accent">cms</span>
        </span>
      </div>

      {/* Nav */}
      <NavLinks collections={collections} session={session} />

      {/* User footer */}
      {session && (
        <div className="flex items-center gap-2.5 px-3.5 py-3 border-t border-cms-border shrink-0">
          <div
            className="w-6.5 h-6.5 rounded-md bg-cms-accent-dim border border-cms-accent-border text-cms-accent font-mono text-sm font-medium flex items-center justify-center shrink-0"
            aria-hidden="true"
          >
            {(session.email?.[0] ?? "?").toUpperCase()}
          </div>
          <div className="min-w-0">
            <span className="font-mono text-sm text-cms-text-3 overflow-hidden text-ellipsis whitespace-nowrap block">
              {session.email}
            </span>
          </div>
        </div>
      )}
    </aside>
  );
}
