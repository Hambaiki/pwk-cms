'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { getOrCreatePageEntry } from '@/lib/actions/entries'

export function EditPageButton({ collectionId }: { collectionId: string }) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function handleClick() {
    startTransition(async () => {
      const entryId = await getOrCreatePageEntry(collectionId)
      router.push(`/cms/editor/${entryId}`)
    })
  }

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-cms bg-cms-accent text-cms-accent-text font-mono text-xs font-medium border-none cursor-pointer shrink-0 transition-opacity disabled:opacity-60 disabled:cursor-not-allowed"
    >
      <svg viewBox="0 0 14 14" fill="none" width="12" height="12" aria-hidden="true">
        <path d="M2 10.5V12h1.5l6-6L8 4.5l-6 6zM12.5 3a1 1 0 000-1.5L11 0a1 1 0 00-1.5 0L8.5 1.5 11 4l1.5-1z" fill="currentColor"/>
      </svg>
      {isPending ? 'Opening…' : 'Edit page'}
    </button>
  )
}
