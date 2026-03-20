"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTransition, useCallback } from "react";
import { useRouter } from "next/navigation";
import { logout } from "@/lib/actions/auth";
import { getOrCreatePageEntry } from "@/lib/actions/entries";
import { cn } from "@/lib/utils";
import type { Collection } from "@/lib/db/schema";

type Props = {
  collections: Collection[];
  session: { userId: string; email?: string } | null;
};

function NavItem({
  href,
  exact = false,
  children,
}: {
  href: string;
  exact?: boolean;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const active = exact ? pathname === href : pathname.startsWith(href);
  return (
    <Link href={href} className={cn("cms-nav-item", active && "active")}>
      {children}
    </Link>
  );
}

function CollectionNavItem({
  col,
  pathname,
}: {
  col: Collection;
  pathname: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const entriesHref = `/cms/entries/${col.slug}`;
  const settingsHref = `/cms/collections/${col.id}`;
  const isActive =
    pathname.startsWith(entriesHref) || pathname.startsWith(settingsHref);
  const isEditorActive = col.isPage
    ? pathname.startsWith("/cms/editor/")
    : pathname.startsWith(entriesHref);

  function handleEntriesClick() {
    if (col.isPage) {
      startTransition(async () => {
        const entryId = await getOrCreatePageEntry(col.id);
        router.push(`/cms/editor/${entryId}`);
      });
    } else {
      router.push(entriesHref);
    }
  }

  const subItemCls = "cms-nav-item w-full text-left";
  const subStyle = {
    fontSize: "11.5px",
    paddingTop: "4px",
    paddingBottom: "4px",
  };

  return (
    <div>
      <div
        className={cn("cms-nav-item", isActive && "active")}
        style={{ cursor: "default" }}
      >
        <span className="cms-nav-icon" aria-hidden="true">
          {col.icon ?? "📄"}
        </span>
        <span className="cms-nav-col-name">{col.name}</span>
        {col.isPage && <span className="cms-nav-page-badge">page</span>}
      </div>

      <div style={{ paddingLeft: "28px" }}>
        <button
          onClick={handleEntriesClick}
          disabled={pending}
          className={cn(subItemCls, isEditorActive && "active")}
          style={subStyle}
        >
          <svg
            viewBox="0 0 14 14"
            fill="none"
            width="12"
            height="12"
            aria-hidden="true"
          >
            <path
              d="M2 3h10M2 7h7M2 11h5"
              stroke="currentColor"
              strokeWidth="1.2"
              strokeLinecap="round"
            />
          </svg>
          {pending ? "Opening…" : col.isPage ? "Edit page" : "Entries"}
        </button>
        <Link
          href={settingsHref}
          className={cn(
            subItemCls,
            pathname.startsWith(settingsHref) && "active",
          )}
          style={subStyle}
        >
          <svg
            viewBox="0 0 14 14"
            fill="none"
            width="12"
            height="12"
            aria-hidden="true"
          >
            <circle
              cx="7"
              cy="7"
              r="5"
              stroke="currentColor"
              strokeWidth="1.2"
            />
            <path
              d="M7 4v3l2 1"
              stroke="currentColor"
              strokeWidth="1.2"
              strokeLinecap="round"
            />
          </svg>
          Schema
        </Link>
      </div>
    </div>
  );
}

export function NavLinks({ collections, session }: Props) {
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  return (
    <nav className="cms-nav">
      <div className="cms-nav-section">
        <NavItem href="/cms" exact>
          <svg
            viewBox="0 0 16 16"
            fill="none"
            width="14"
            height="14"
            aria-hidden="true"
          >
            <path
              d="M2 6.5L8 2l6 4.5V14a1 1 0 01-1 1H3a1 1 0 01-1-1V6.5z"
              stroke="currentColor"
              strokeWidth="1.2"
              strokeLinejoin="round"
            />
          </svg>
          Dashboard
        </NavItem>
        <NavItem href="/cms/media">
          <svg
            viewBox="0 0 16 16"
            fill="none"
            width="14"
            height="14"
            aria-hidden="true"
          >
            <rect
              x="1.5"
              y="3.5"
              width="13"
              height="9"
              rx="1.5"
              stroke="currentColor"
              strokeWidth="1.2"
            />
            <circle
              cx="5.5"
              cy="7"
              r="1.5"
              stroke="currentColor"
              strokeWidth="1.2"
            />
            <path
              d="M1.5 11l3.5-3 3 2.5 2-2 4 4"
              stroke="currentColor"
              strokeWidth="1.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Media
        </NavItem>
      </div>

      <div className="cms-nav-section">
        <div className="cms-nav-label">
          Collections
          <Link
            href="/cms/collections/new"
            className="cms-nav-add"
            aria-label="New collection"
          >
            <svg
              viewBox="0 0 12 12"
              fill="none"
              width="12"
              height="12"
              aria-hidden="true"
            >
              <path
                d="M6 2v8M2 6h8"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </Link>
        </div>

        {collections.length === 0 ? (
          <p className="cms-nav-empty">No collections yet</p>
        ) : (
          collections.map((col) => (
            <CollectionNavItem key={col.id} col={col} pathname={pathname} />
          ))
        )}

        <NavItem href="/cms/collections">
          <svg
            viewBox="0 0 16 16"
            fill="none"
            width="14"
            height="14"
            aria-hidden="true"
          >
            <path
              d="M2 4h12M2 8h8M2 12h5"
              stroke="currentColor"
              strokeWidth="1.2"
              strokeLinecap="round"
            />
          </svg>
          All collections
        </NavItem>
        <NavItem href="/cms/tags">
          <svg
            viewBox="0 0 16 16"
            fill="none"
            width="14"
            height="14"
            aria-hidden="true"
          >
            <path
              d="M2 8.5L7.5 3H14v6.5L8.5 15 2 8.5z"
              stroke="currentColor"
              strokeWidth="1.2"
              strokeLinejoin="round"
            />
            <circle cx="11" cy="6" r="1" fill="currentColor" />
          </svg>
          Tags
        </NavItem>
      </div>

      <div className="cms-nav-section">
        <div className="cms-nav-label">Settings</div>
        <NavItem href="/cms/settings/api-keys">
          <svg
            viewBox="0 0 16 16"
            fill="none"
            width="14"
            height="14"
            aria-hidden="true"
          >
            <circle
              cx="6"
              cy="9"
              r="3.5"
              stroke="currentColor"
              strokeWidth="1.2"
            />
            <path
              d="M8.5 6.5L13 2M11 2h2v2"
              stroke="currentColor"
              strokeWidth="1.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          API keys
        </NavItem>
        <NavItem href="/cms/settings/team">
          <svg
            viewBox="0 0 16 16"
            fill="none"
            width="14"
            height="14"
            aria-hidden="true"
          >
            <circle
              cx="6"
              cy="5"
              r="2.5"
              stroke="currentColor"
              strokeWidth="1.2"
            />
            <path
              d="M1 13c0-2.761 2.239-4 5-4s5 1.239 5 4"
              stroke="currentColor"
              strokeWidth="1.2"
              strokeLinecap="round"
            />
            <path
              d="M12 7a2 2 0 100-4M15 13c0-2-1.5-3.5-3-4"
              stroke="currentColor"
              strokeWidth="1.2"
              strokeLinecap="round"
            />
          </svg>
          Team
        </NavItem>
      </div>

      {session && (
        <div className="cms-nav-section cms-nav-bottom">
          <button
            onClick={() => startTransition(() => logout())}
            disabled={isPending}
            className="cms-nav-item cms-nav-signout"
          >
            <svg
              viewBox="0 0 16 16"
              fill="none"
              width="14"
              height="14"
              aria-hidden="true"
            >
              <path
                d="M6 2H3a1 1 0 00-1 1v10a1 1 0 001 1h3M10 11l3-3-3-3M13 8H6"
                stroke="currentColor"
                strokeWidth="1.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            {isPending ? "Signing out…" : "Sign out"}
          </button>
        </div>
      )}
    </nav>
  );
}
