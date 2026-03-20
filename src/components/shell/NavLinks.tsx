"use client";

import Link from "next/link";
import { Suspense } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { logout } from "@/lib/actions/auth";
import { getOrCreatePageEntry } from "@/lib/actions/entries";
import { cn } from "@/lib/utils";
import type { Collection, MemberRole } from "@/lib/db/schema";

// ─── Shared class strings ──────────────────────────────────────────────────────

const navItemBase =
  "flex items-center gap-2 px-4 py-1.5 text-[12.5px] text-cms-text2 no-underline transition-colors duration-100 cursor-pointer border-none bg-none w-full text-left relative";
const navItemHover = "hover:text-cms-text hover:bg-white/[0.04]";
const navItemActive =
  "text-cms-text bg-cms-accent-dim before:absolute before:left-0 before:top-1 before:bottom-1 before:w-0.5 before:bg-cms-accent before:rounded-r";

type Props = {
  collections: (Collection & { role: MemberRole })[];
  session: { userId: string; email?: string } | null;
};

// ─── NavItem ───────────────────────────────────────────────────────────────────

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
    <Link
      href={href}
      className={cn(navItemBase, navItemHover, active && navItemActive)}
    >
      {children}
    </Link>
  );
}

// ─── CollectionNavItem ─────────────────────────────────────────────────────────

function CollectionNavItem({
  col,
  pathname,
}: {
  col: Collection & { role: MemberRole };
  pathname: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [pageEntryId, setPageEntryId] = useState<string | null>(null);

  const collectionHref = `/cms/collections/${col.id}`;
  const entriesHref = `/cms/entries/${col.slug}`;
  const mediaHref = `/cms/media?collection=${col.id}`;
  const schemaHref = `/cms/collections/${col.id}/schema`;
  const membersHref = `/cms/collections/${col.id}/members`;
  const apiDocsHref = `/cms/collections/${col.id}/api`;

  const searchParams = useSearchParams();

  // Precise active checks — each scoped to this specific collection
  const isCollectionActive = pathname === collectionHref;
  const isSchemaActive = pathname === schemaHref;
  const isMembersActive = pathname === membersHref;
  const isApiDocsActive = pathname === apiDocsHref;
  const isMediaActive =
    pathname === "/cms/media" && searchParams.get("collection") === col.id;

  const isEntriesActive = col.isPage
    ? pageEntryId
      ? pathname === `/cms/editor/${pageEntryId}`
      : false
    : pathname.startsWith(entriesHref);

  // Parent row is "active" if on any sub-page of this collection
  const isAnyActive =
    isCollectionActive ||
    isEntriesActive ||
    isMediaActive ||
    isSchemaActive ||
    isMembersActive ||
    isApiDocsActive;

  function handleEntriesClick() {
    if (col.isPage) {
      startTransition(async () => {
        const entryId = await getOrCreatePageEntry(col.id);
        setPageEntryId(entryId);
        router.push(`/cms/editor/${entryId}`);
      });
    } else {
      router.push(entriesHref);
    }
  }

  const subItem = cn(navItemBase, navItemHover, "text-[11.5px] py-1");

  return (
    <div>
      {/* Collection label — links to its detail page */}
      <Link
        href={collectionHref}
        className={cn(
          navItemBase,
          navItemHover,
          isAnyActive && "text-cms-text",
          isCollectionActive && navItemActive,
        )}
      >
        <span className="text-xs w-3.5 text-center shrink-0" aria-hidden="true">
          {col.icon ?? "📄"}
        </span>
        <span className="flex-1 overflow-hidden text-ellipsis whitespace-nowrap">
          {col.name}
        </span>
        {col.isPage && (
          <span className="font-mono text-xxs px-1.5 py-px rounded bg-[rgba(130,90,220,0.15)] border border-[rgba(130,90,220,0.25)] text-[#a080e8] shrink-0">
            page
          </span>
        )}
      </Link>

      {/* Sub-links — indented under collection */}
      <div className="pl-7">
        {/* Entries / Edit page */}
        <button
          onClick={handleEntriesClick}
          disabled={pending}
          className={cn(subItem, isEntriesActive && navItemActive)}
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

        {/* Media */}
        <Link
          href={mediaHref}
          className={cn(subItem, isMediaActive && navItemActive)}
        >
          <svg
            viewBox="0 0 14 14"
            fill="none"
            width="12"
            height="12"
            aria-hidden="true"
          >
            <rect
              x="1"
              y="2.5"
              width="12"
              height="9"
              rx="1.5"
              stroke="currentColor"
              strokeWidth="1.2"
            />
            <circle
              cx="4.5"
              cy="6"
              r="1.5"
              stroke="currentColor"
              strokeWidth="1.2"
            />
            <path
              d="M1 9.5l3-2.5 2.5 2 1.5-1.5 3.5 3"
              stroke="currentColor"
              strokeWidth="1.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Media
        </Link>

        {/* Schema */}
        <Link
          href={schemaHref}
          className={cn(subItem, isSchemaActive && navItemActive)}
        >
          <svg
            viewBox="0 0 14 14"
            fill="none"
            width="12"
            height="12"
            aria-hidden="true"
          >
            <rect
              x="1"
              y="1.5"
              width="12"
              height="2.5"
              rx="0.8"
              stroke="currentColor"
              strokeWidth="1.2"
            />
            <rect
              x="1"
              y="5.5"
              width="8"
              height="2.5"
              rx="0.8"
              stroke="currentColor"
              strokeWidth="1.2"
            />
            <rect
              x="1"
              y="9.5"
              width="5"
              height="2.5"
              rx="0.8"
              stroke="currentColor"
              strokeWidth="1.2"
            />
          </svg>
          Schema
        </Link>

        {/* Members — only if owner, can't check here without extra data, show always and let server gate */}
        <Link
          href={membersHref}
          className={cn(subItem, isMembersActive && navItemActive)}
        >
          <svg
            viewBox="0 0 14 14"
            fill="none"
            width="12"
            height="12"
            aria-hidden="true"
          >
            <circle
              cx="5"
              cy="4"
              r="2"
              stroke="currentColor"
              strokeWidth="1.2"
            />
            <path
              d="M1 11.5c0-2.2 1.8-3.5 4-3.5s4 1.3 4 3.5"
              stroke="currentColor"
              strokeWidth="1.2"
              strokeLinecap="round"
            />
            <path
              d="M10.5 6a1.5 1.5 0 100-3M13 11.5c0-1.5-1-2.7-2.5-3"
              stroke="currentColor"
              strokeWidth="1.2"
              strokeLinecap="round"
            />
          </svg>
          Members
        </Link>

        {/* API docs */}
        <Link
          href={apiDocsHref}
          className={cn(subItem, isApiDocsActive && navItemActive)}
        >
          <svg
            viewBox="0 0 14 14"
            fill="none"
            width="12"
            height="12"
            aria-hidden="true"
          >
            <path
              d="M2 4l3 3-3 3M7 10h5"
              stroke="currentColor"
              strokeWidth="1.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          API docs
        </Link>
      </div>
    </div>
  );
}

// ─── NavSection / NavLabel helpers ────────────────────────────────────────────

function NavSection({ children }: { children: React.ReactNode }) {
  return (
    <div className="py-1 border-b border-cms-border last:border-b-0">
      {children}
    </div>
  );
}

function NavLabel({
  children,
  action,
}: {
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between px-4 pt-1.5 pb-1 font-mono text-xs font-medium tracking-[0.08em] uppercase text-cms-text3">
      {children}
      {action}
    </div>
  );
}

// ─── NavLinks ─────────────────────────────────────────────────────────────────

export function NavLinks({ collections, session }: Props) {
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  return (
    <nav className="flex-1 overflow-y-auto overflow-x-hidden flex flex-col py-2 scrollbar-thin">
      {/* Dashboard */}
      <NavSection>
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
      </NavSection>

      {/* Collections */}
      <NavSection>
        <NavLabel
          action={
            <Link
              href="/cms/collections/new"
              className="text-cms-text3 hover:text-cms-accent transition-colors"
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
          }
        >
          Collections
        </NavLabel>

        {collections.length === 0 ? (
          <p className="px-4 py-1 font-mono text-sm text-cms-text3 italic">
            No collections yet
          </p>
        ) : (
          collections.map((col) => (
            <Suspense key={col.id} fallback={null}>
              <CollectionNavItem col={col} pathname={pathname} />
            </Suspense>
          ))
        )}

        {/* All collections — exact match to avoid lighting up on sub-pages */}
        <NavItem href="/cms/collections" exact>
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
      </NavSection>

      {/* Sign out — pushed to bottom */}
      {session && (
        <div className="mt-auto border-t border-cms-border pt-1">
          <button
            onClick={() => startTransition(() => logout())}
            disabled={isPending}
            className={cn(
              navItemBase,
              navItemHover,
              "text-cms-text3 hover:text-cms-danger hover:bg-cms-danger-dim disabled:opacity-60",
            )}
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
