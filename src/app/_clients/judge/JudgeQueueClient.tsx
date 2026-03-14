'use client'
import Link from 'next/link'
import type { Event, Submission } from '@/types'
import { Badge } from '@/components/ui/Badge'

interface Props {
  event: Event
  submissions: Submission[]
}

export function JudgeQueueClient({ event, submissions }: Props) {
  if (submissions.length === 0) {
    return (
      <div className="card text-center py-16 text-gray-400 fade-up">
        <div className="text-sm uppercase tracking-[0.2em] text-gray-500 mb-2">Queue Empty</div>
        No submissions are ready yet. Refresh in a moment.
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {submissions.map((s) => (
        <Link
          key={s.id}
          href={`/events/${event.slug}/judge/${s.id}`}
          className="interactive-card group flex items-center justify-between block fade-up"
        >
          <div className="min-w-0">
            <div className="font-semibold text-white mb-1 tracking-tight">{s.team_name}</div>
            <div className="text-xs text-gray-500 font-mono truncate max-w-xs">
              {s.github_url.replace('https://github.com/', '')}
            </div>
            {s.pitch_text && (
              <div className="text-xs text-gray-400 mt-2 line-clamp-1">{s.pitch_text}</div>
            )}
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <Badge variant="green">Ready</Badge>
            <span className="text-gray-400 text-sm group-hover:text-gray-200 transition-colors">Open Scorecard</span>
          </div>
        </Link>
      ))}
    </div>
  )
}
