'use client'

import { useTransition } from 'react'
import { logout } from '@/lib/actions/auth'

interface LogoutButtonProps {
  className?: string
}

export function LogoutButton({ className }: LogoutButtonProps) {
  const [isPending, startTransition] = useTransition()

  return (
    <button
      onClick={() => startTransition(() => logout())}
      disabled={isPending}
      className={[
        'text-sm text-stone-400 hover:text-red-400 transition-colors',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        className,
      ].join(' ')}
    >
      {isPending ? 'Signing out…' : 'Sign Out'}
    </button>
  )
}
