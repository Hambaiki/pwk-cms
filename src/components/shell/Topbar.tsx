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
  const crumbs: Crumb[] = [{ label: "pwk-cms", href: "/cms" }];

  let path = "/cms";
  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];
    path = `${path}/${seg}`;
    const isLast = i === segments.length - 1;

    const labels: Record<string, string> = {
      collections: "Collections",
      new: "New",
      media: "Media",
      settings: "Settings",
      "api-keys": "API keys",
      team: "Team",
      entries: "Entries",
      editor: "Editor",
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
    <header className="h-11 shrink-0 flex items-center px-6 border-b border-cms-border bg-cms-surface">
      <nav className="flex items-center" aria-label="Breadcrumb">
        {crumbs.map((crumb, i) => (
          <span key={i} className="flex items-center">
            {i > 0 && (
              <span
                className="font-mono text-xs text-cms-text-3 mx-1.5"
                aria-hidden="true"
              >
                /
              </span>
            )}
            {crumb.href ? (
              <Link
                href={crumb.href}
                className="font-mono text-xs text-cms-text-3 hover:text-cms-text-2 transition-colors no-underline"
              >
                {crumb.label}
              </Link>
            ) : (
              <span
                className="font-mono text-xs text-cms-text-2"
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
