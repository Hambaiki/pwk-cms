"use client";

import Link from "next/link";
import { Suspense } from "react";
import { usePathname } from "next/navigation";
import { useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Home,
  FileText,
  Image,
  Settings,
  Users,
  Code,
  Plus,
  LogOut,
  List,
  Wrench,
  ChevronDown,
} from "lucide-react";
import { logout } from "@/lib/actions/auth";
import { getOrCreatePageEntry } from "@/lib/actions/entries";
import { cn } from "@/lib/utils";
import type { Collection, MemberRole } from "@/lib/db/schema";

// ─── Shared class strings ──────────────────────────────────────────────────────

const navItemBase =
  "flex items-center gap-2 px-4 py-1.5 text-sm text-cms-text-2 no-underline transition-colors duration-100 cursor-pointer border-none bg-none w-full text-left relative";
const navItemHover = "hover:text-cms-text hover:bg-white/4";
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
  const [isExpanded, setIsExpanded] = useState(false);

  const collectionHref = `/cms/collections/${col.id}`;
  const entriesHref = `/cms/collections/${col.id}/entries`;
  const mediaHref = `/cms/collections/${col.id}/media`;
  const settingsHref = `/cms/collections/${col.id}/settings`;
  const schemaHref = `/cms/collections/${col.id}/settings/schema`;
  const membersHref = `/cms/collections/${col.id}/settings/members`;
  const tagsHref = `/cms/collections/${col.id}/settings/tags`;
  const apiKeysHref = `/cms/collections/${col.id}/settings/api-keys`;
  const apiDocsHref = `/cms/collections/${col.id}/api`;

  // Precise active checks — each scoped to this specific collection
  const isCollectionActive = pathname === collectionHref;
  const isSettingsActive =
    pathname === settingsHref ||
    pathname === schemaHref ||
    pathname === membersHref ||
    pathname === tagsHref ||
    pathname === apiKeysHref;
  const isApiDocsActive = pathname === apiDocsHref;
  const isMediaActive = pathname === mediaHref;

  const isEntriesActive = col.isPage
    ? pageEntryId
      ? pathname === `/cms/collections/${col.id}/entries/${pageEntryId}`
      : false
    : pathname.startsWith(entriesHref);

  // Parent row is "active" if on any sub-page of this collection
  const isAnyActive =
    isCollectionActive ||
    isEntriesActive ||
    isMediaActive ||
    isSettingsActive ||
    isApiDocsActive;

  // Auto-expand when this collection is active
  const shouldBeExpanded = isExpanded;

  function handleEntriesClick() {
    if (col.isPage) {
      startTransition(async () => {
        const entryId = await getOrCreatePageEntry(col.id);
        setPageEntryId(entryId);
        router.push(`/cms/collections/${col.id}/entries/${entryId}`);
      });
    } else {
      router.push(entriesHref);
    }
  }

  const subItem = cn(navItemBase, navItemHover, "text-sm py-1");

  return (
    <div>
      {/* Collection label with expand/collapse toggle */}
      <div className="relative flex items-center gap-1">
        <Link
          href={collectionHref}
          className={cn(
            "flex-1 flex items-center gap-2 px-2 py-2 pl-8 text-sm text-cms-text-2 no-underline transition-colors duration-100 cursor-pointer border-none bg-none text-left relative hover:text-cms-text hover:bg-white/4",
            isAnyActive && "text-cms-text",
            isCollectionActive &&
              "bg-cms-accent-dim before:absolute before:left-0 before:top-1 before:bottom-1 before:w-0.5 before:bg-cms-accent before:rounded-r",
          )}
        >
          <span
            className="text-sm w-3.5 text-center shrink-0"
            aria-hidden="true"
          >
            {col.icon ?? "📄"}
          </span>
          <span className="flex-1 overflow-hidden text-ellipsis whitespace-nowrap">
            {col.name}
          </span>
          {col.isPage && (
            <span className="font-mono text-xs px-1.5 py-px rounded bg-[rgba(130,90,220,0.15)] border border-[rgba(130,90,220,0.25)] text-[#a080e8] shrink-0">
              page
            </span>
          )}
        </Link>
        <button
          onClick={() => setIsExpanded(!shouldBeExpanded)}
          className={cn(
            "absolute left-2",
            "flex items-center justify-center w-5 h-5 shrink-0 text-cms-text-3 hover:text-cms-text hover:bg-cms-accent rounded transition-colors",
            shouldBeExpanded && "rotate-180",
          )}
          aria-label={shouldBeExpanded ? "Collapse" : "Expand"}
        >
          <ChevronDown size={14} />
        </button>
      </div>

      {/* Sub-links — shown only when expanded */}
      {shouldBeExpanded && (
        <div className="pl-6 animate-in fade-in duration-150">
          {/* Entries / Edit page */}
          <button
            onClick={handleEntriesClick}
            disabled={pending}
            className={cn(subItem, isEntriesActive && navItemActive)}
          >
            <FileText size={16} />
            {pending ? "Opening…" : col.isPage ? "Edit page" : "Entries"}
          </button>

          {/* Media */}
          <Link
            href={mediaHref}
            className={cn(subItem, isMediaActive && navItemActive)}
          >
            <Image size={16} />
            Media
          </Link>

          {/* Settings */}
          <Link
            href={settingsHref}
            className={cn(subItem, isSettingsActive && navItemActive)}
          >
            <Settings size={16} />
            Settings
          </Link>

          {/* API docs */}
          <Link
            href={apiDocsHref}
            className={cn(subItem, isApiDocsActive && navItemActive)}
          >
            <Code size={16} />
            API docs
          </Link>
        </div>
      )}
    </div>
  );
}

// ─── NavSection / NavLabel helpers ────────────────────────────────────────────

function NavSection({ children }: { children: React.ReactNode }) {
  return (
    <div className="border-b border-cms-border last:border-b-0">
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
    <div className="flex items-center justify-between px-4 pt-1.5 pb-1 font-mono text-sm font-medium tracking-[0.08em] uppercase text-cms-text-3">
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
    <nav className="flex-1 overflow-y-auto overflow-x-hidden flex flex-col">
      {/* Dashboard */}
      <NavSection>
        <NavItem href="/cms" exact>
          <Home size={14} />
          Dashboard
        </NavItem>
        <NavItem href="/cms/profile" exact>
          <Users size={14} />
          Profile
        </NavItem>
        <NavItem href="/cms/settings" exact>
          <Wrench size={14} />
          Settings
        </NavItem>
      </NavSection>

      {/* Collections */}
      <NavSection>
        <NavLabel
          action={
            <Link
              href="/cms/collections/new"
              className="text-cms-text-3 hover:text-cms-accent transition-colors"
              aria-label="New collection"
            >
              <Plus size={16} />
            </Link>
          }
        >
          Collections
        </NavLabel>

        {collections.length === 0 ? (
          <p className="px-4 py-1 font-mono text-sm text-cms-text-3 italic">
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
          <List size={14} />
          All collections
        </NavItem>
      </NavSection>

      {/* Sign out — pushed to bottom */}
      {session && (
        <div className="mt-auto border-t border-cms-border">
          <button
            onClick={() => startTransition(() => logout())}
            disabled={isPending}
            className={cn(
              navItemBase,
              navItemHover,
              "text-cms-text-3 hover:text-cms-danger hover:bg-cms-danger-dim disabled:opacity-60",
            )}
          >
            <LogOut size={14} />
            {isPending ? "Signing out…" : "Sign out"}
          </button>
        </div>
      )}
    </nav>
  );
}
