import Link from 'next/link'
import { getCollections } from '@/lib/actions/collections'
import { getOptionalSession } from '@/lib/dal'
import { NavLinks } from './NavLinks'

export async function Sidebar() {
  const [collections, session] = await Promise.all([
    getCollections(),
    getOptionalSession(),
  ])

  return (
    <aside className="cms-sidebar">
      {/* Brand */}
      <div className="cms-brand">
        <div className="cms-brand-mark" aria-hidden="true">
          <svg viewBox="0 0 20 20" fill="none" width="16" height="16">
            <rect x="2" y="2" width="7" height="7" rx="1.5" fill="currentColor" opacity="1"/>
            <rect x="11" y="2" width="7" height="7" rx="1.5" fill="currentColor" opacity="0.5"/>
            <rect x="2" y="11" width="7" height="7" rx="1.5" fill="currentColor" opacity="0.5"/>
            <rect x="11" y="11" width="7" height="7" rx="1.5" fill="currentColor" opacity="0.25"/>
          </svg>
        </div>
        <span className="cms-brand-name">pwk<span>cms</span></span>
      </div>

      {/* Nav */}
      <NavLinks collections={collections} session={session} />

      {/* User footer */}
      {session && (
        <div className="cms-user-footer">
          <div className="cms-user-avatar" aria-hidden="true">
            {(session.email?.[0] ?? '?').toUpperCase()}
          </div>
          <div className="cms-user-info">
            <span className="cms-user-email">{session.email}</span>
          </div>
        </div>
      )}
    </aside>
  )
}
