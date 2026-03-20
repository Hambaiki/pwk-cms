'use client'

import { useTransition, useState } from 'react'
import { deleteCollection } from '@/lib/actions/collections'

type Props = {
  collectionId: string
  collectionName: string
}

export function DeleteCollectionButton({ collectionId, collectionName }: Props) {
  const [isPending, startTransition] = useTransition()
  const [confirming, setConfirming] = useState(false)

  if (confirming) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs text-stone-400">Delete &ldquo;{collectionName}&rdquo;?</span>
        <button
          onClick={() => startTransition(() => deleteCollection(collectionId))}
          disabled={isPending}
          className="rounded-lg bg-red-500/10 border border-red-500/30 px-3 py-1.5 text-xs text-red-400 hover:bg-red-500/20 transition-colors disabled:opacity-50"
        >
          {isPending ? 'Deleting…' : 'Yes, delete'}
        </button>
        <button
          onClick={() => setConfirming(false)}
          className="rounded-lg border border-stone-700 px-3 py-1.5 text-xs text-stone-400 hover:text-stone-200 transition-colors"
        >
          Cancel
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className="rounded-lg border border-stone-800 px-3 py-1.5 text-xs text-stone-500 hover:border-red-500/40 hover:text-red-400 transition-colors"
    >
      Delete collection
    </button>
  )
}
