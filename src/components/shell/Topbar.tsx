'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'

type Crumb = { label: string; href?: string }

function buildCrumbs(pathname: string): Crumb[] {
  const segments = pathname.replace(/^\/cms\/?/, '').split('/').filter(Boolean)
  const crumbs: Crumb[] = [{ label: 'pwk-cms', href: '/cms' }]

  let path = '/cms'
  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i]
    path = `${path}/${seg}`
    const isLast = i === segments.length - 1

    // Human-readable label mappings
    const labels: Record<string, string> = {
      collections: 'Collections',
      new: 'New',
      media: 'Media',
      settings: 'Settings',
      'api-keys': 'API keys',
      team: 'Team',
      entries: 'Entries',
      editor: 'Editor',
    }

    const label = labels[seg] ?? seg
    crumbs.push(isLast ? { label } : { label, href: path })
  }

  return crumbs
}

export function Topbar() {
  const pathname = usePathname()
  const crumbs = buildCrumbs(pathname)

  return (
    <header className="cms-topbar">
      <nav className="cms-breadcrumbs" aria-label="Breadcrumb">
        {crumbs.map((crumb, i) => (
          <span key={i} className="cms-breadcrumb-item">
            {i > 0 && <span className="cms-breadcrumb-sep" aria-hidden="true">/</span>}
            {crumb.href ? (
              <Link href={crumb.href} className="cms-breadcrumb-link">
                {crumb.label}
              </Link>
            ) : (
              <span className="cms-breadcrumb-current" aria-current="page">
                {crumb.label}
              </span>
            )}
          </span>
        ))}
      </nav>
    </header>
  )
}
