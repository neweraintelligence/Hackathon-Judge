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
      <div className="card text-center py-16 text-gray-500">
        No submissions ready to judge yet. Check back soon!
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {submissions.map((s) => (
        <Link
          key={s.id}
          href={`/events/${event.slug}/judge/${s.id}`}
          className="card flex items-center justify-between hover:border-purple-500/30 transition-colors block"
        >
          <div>
            <div className="font-medium text-white mb-0.5">{s.team_name}</div>
            <div className="text-xs text-gray-500 font-mono truncate max-w-xs">
              {s.github_url.replace('https://github.com/', '')}
            </div>
            {s.pitch_text && (
              <div className="text-xs text-gray-400 mt-1 line-clamp-1">{s.pitch_text}</div>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Badge variant="green">Ready</Badge>
            <span className="text-gray-500 text-sm">Score →</span>
          </div>
        </Link>
      ))}
    </div>
  )
}
