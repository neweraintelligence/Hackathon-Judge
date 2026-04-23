'use client'
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { deleteEvent } from '@/lib/actions/events'

interface Props {
  id: string
  name: string
  slug: string
  date: string
  judgingMode: string
}

export function EventRow({ id, name, slug, date, judgingMode }: Props) {
  const router = useRouter()
  const [confirm, setConfirm] = useState(false)
  const [isPending, startTransition] = useTransition()

  const formattedDate = new Date(date + 'T00:00:00Z').toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  })

  return (
    <div className="interactive-card flex items-center justify-between fade-up group">
      <Link href={`/events/${slug}`} className="flex-1 min-w-0">
        <div className="font-semibold text-white mb-0.5">{name}</div>
        <div className="text-sm text-gray-500">
          {formattedDate}
          {' · '}
          <span className="capitalize">{judgingMode} mode</span>
        </div>
      </Link>

      <div className="flex items-center gap-3 shrink-0 ml-4">
        {confirm ? (
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400 hidden sm:inline">
              Delete event and all submissions?
            </span>
            <button
              onClick={() => setConfirm(false)}
              disabled={isPending}
              className="text-xs text-gray-500 hover:text-gray-300 px-2 py-1 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              disabled={isPending}
              onClick={() =>
                startTransition(async () => {
                  const res = await deleteEvent(id)
                  if (res.error) {
                    alert(`Failed to delete: ${res.error}`)
                    setConfirm(false)
                  } else {
                    router.refresh()
                  }
                })
              }
              className="text-xs font-medium text-rose-400 hover:text-rose-300 px-2 py-1 disabled:opacity-50"
            >
              {isPending ? 'Deleting…' : 'Delete'}
            </button>
          </div>
        ) : (
          <>
            <Link href={`/events/${slug}`} className="text-gray-500 text-sm">
              Open
            </Link>
            <button
              onClick={() => setConfirm(true)}
              className="text-gray-700 hover:text-rose-400 transition-colors opacity-0 group-hover:opacity-100 text-sm px-1"
              title="Delete event"
              aria-label="Delete event"
            >
              ✕
            </button>
          </>
        )}
      </div>
    </div>
  )
}
