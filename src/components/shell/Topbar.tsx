"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";

type Crumb = { label: string; href?: string };

function buildCrumbs(pathname: string): Crumb[] {
  const segments = pathname
    .replace(/^\/cms\/?/, "")
    .split("/")
    .filter(Boolean);
  const crumbs: Crumb[] = [{ label: "cms", href: "/cms" }];

  let path = "/cms";
  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];
    path = `${path}/${seg}`;
    const isLast = i === segments.length - 1;

    // Special handling for collection-scoped routes
    if (seg === "entries" && segments[i - 2] === "collections" && segments[i - 1] && !isLast && segments[i + 1]) {
      // This is /cms/collections/[id]/entries/[entryId] - make "entries" link to the list
      crumbs.push({ label: "Entries", href: path });
      // Add the entry ID as the last crumb (not clickable)
      crumbs.push({ label: segments[i + 1] });
      break; // Don't process the entryId segment
    }

    const labels: Record<string, string> = {
      collections: "Collections",
      new: "New",
      media: "Media",
      settings: "Settings",
      "api-keys": "API keys",
      team: "Team",
      entries: "Entries",
      tags: "Tags",
    };

    const label = labels[seg] ?? seg;
    crumbs.push(isLast ? { label } : { label, href: path });
  }

  return crumbs;
}

export function Topbar() {
  const pathname = usePathname();
  const crumbs = buildCrumbs(pathname);

  return (
    <header className="h-14 shrink-0 flex items-center px-6 border-b border-cms-border bg-cms-surface">
      <nav className="flex items-center" aria-label="Breadcrumb">
        {crumbs.map((crumb, i) => (
          <span key={i} className="flex items-center">
            {i > 0 && (
              <span
                className="font-mono text-sm text-cms-text-3 mx-1.5"
                aria-hidden="true"
              >
                /
              </span>
            )}
            {crumb.href ? (
              <Link
                href={crumb.href}
                className="font-mono text-sm text-cms-text-3 hover:text-cms-text-2 transition-colors no-underline"
              >
                {crumb.label}
              </Link>
            ) : (
              <span
                className="font-mono text-sm text-cms-text-2"
                aria-current="page"
              >
                {crumb.label}
              </span>
            )}
          </span>
        ))}
      </nav>
    </header>
  );
}
