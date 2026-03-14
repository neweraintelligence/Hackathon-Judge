'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { LeaderboardEntry } from '@/types'
import { ProgressRing } from '@/components/ui/ProgressRing'

interface Props {
  eventId: string
  initialLeaderboard: LeaderboardEntry[]
}

export function LeaderboardClient({ eventId, initialLeaderboard }: Props) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>(initialLeaderboard)

  useEffect(() => {
    const supabase = createClient()

    const channel = supabase
      .channel(`pool_scores:${eventId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'pool_scores' },
        () => {
          // Refetch on any change
          supabase
            .from('pool_scores')
            .select('submission_id, overall_score, pool_rank, percentile, submissions!inner(team_name, event_id)')
            .eq('submissions.event_id', eventId)
            .order('pool_rank', { ascending: true })
            .then(({ data }) => {
              if (data) {
                setEntries(
                  data.map((row: any) => ({
                    submission_id: row.submission_id,
                    team_name: row.submissions.team_name,
                    overall_score: row.overall_score,
                    pool_rank: row.pool_rank,
                    percentile: row.percentile,
                    judge_score_count: 0,
                  }))
                )
              }
            })
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [eventId])

  if (entries.length === 0) {
    return (
      <div className="card text-center py-16 text-gray-500">
        No scores yet — waiting for analysis to complete
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {entries.map((entry, i) => (
        <div
          key={entry.submission_id}
          className={`card flex items-center gap-4 transition-all duration-300 ${
            i === 0 ? 'border-yellow-500/30 shadow-[0_0_20px_rgba(234,179,8,0.1)]' : ''
          }`}
          style={{ animationDelay: `${i * 50}ms` }}
        >
          <div
            className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
              i === 0 ? 'bg-yellow-500/20 text-yellow-400' :
              i === 1 ? 'bg-gray-400/20 text-gray-300' :
              i === 2 ? 'bg-orange-600/20 text-orange-400' :
              'bg-white/5 text-gray-500'
            }`}
          >
            {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : entry.pool_rank}
          </div>

          <div className="flex-1">
            <div className="font-semibold text-white">{entry.team_name}</div>
            <div className="text-xs text-gray-500">
              {entry.percentile}th percentile
            </div>
          </div>

          <ProgressRing score={entry.overall_score} size={56} strokeWidth={4} />
        </div>
      ))}
    </div>
  )
}
