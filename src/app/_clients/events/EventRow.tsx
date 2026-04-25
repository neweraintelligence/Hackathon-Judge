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
  index?: number
}

export function EventRow({ id, name, slug, date, judgingMode, index = 0 }: Props) {
  const router = useRouter()
  const [confirm, setConfirm] = useState(false)
  const [isPending, startTransition] = useTransition()

  const formattedDate = new Date(date + 'T00:00:00Z').toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  })

  return (
    <div
      className="interactive-card"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        animation: `fadeUp 0.36s ${index * 0.07}s cubic-bezier(0.16,1,0.3,1) both`,
      }}
    >
      <Link href={`/events/${slug}`} style={{ display: 'flex', alignItems: 'center', gap: 14, flex: 1, minWidth: 0, textDecoration: 'none', color: 'inherit' }}>
        <div style={{
          width: 42, height: 42, borderRadius: 11, flexShrink: 0,
          background: 'linear-gradient(135deg, rgba(61,106,243,0.18), rgba(124,92,252,0.18))',
          border: '1px solid rgba(124,92,252,0.18)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 17,
        }}>
          ◈
        </div>
        <div>
          <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4, color: 'var(--text)' }}>{name}</div>
          <div style={{ display: 'flex', gap: 10, fontSize: 12, color: 'var(--muted)' }}>
            <span>{formattedDate}</span>
            <span style={{ opacity: 0.3 }}>·</span>
            <span style={{ textTransform: 'capitalize' }}>{judgingMode} mode</span>
          </div>
        </div>
      </Link>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
        {confirm ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 12, color: 'var(--muted)' }}>Delete event?</span>
            <button
              onClick={() => setConfirm(false)}
              disabled={isPending}
              className="btn-ghost"
              style={{ fontSize: 12, padding: '4px 8px' }}
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
              style={{
                fontSize: 12, padding: '4px 8px', borderRadius: 6, border: 'none', cursor: 'pointer',
                background: 'rgba(240,96,128,0.1)', color: 'var(--red)', fontFamily: 'inherit',
                opacity: isPending ? 0.5 : 1,
              }}
            >
              {isPending ? 'Deleting…' : 'Delete'}
            </button>
          </div>
        ) : (
          <button
            onClick={() => setConfirm(true)}
            style={{
              background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)',
              opacity: 0.4, fontSize: 13, padding: '4px 6px', borderRadius: 5,
              transition: 'opacity 0.18s, color 0.18s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.color = 'var(--red)' }}
            onMouseLeave={(e) => { e.currentTarget.style.opacity = '0.4'; e.currentTarget.style.color = 'var(--muted)' }}
            title="Delete event"
          >
            ✕
          </button>
        )}
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" style={{ color: 'var(--muted)', opacity: 0.35, flexShrink: 0 }}>
          <path d="M3.5 8h9M8.5 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    </div>
  )
}
