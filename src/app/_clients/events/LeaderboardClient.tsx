'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { JudgingMode, LeaderboardEntry } from '@/types'
import { ProgressRing } from '@/components/ui/ProgressRing'

interface Props {
  eventId: string
  initialLeaderboard: LeaderboardEntry[]
  judgingMode?: JudgingMode
}

export function LeaderboardClient({ eventId, initialLeaderboard, judgingMode }: Props) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>(initialLeaderboard)
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()

    if (judgingMode === 'pairwise') {
      const channel = supabase
        .channel(`pairwise_comparisons:${eventId}`)
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'pairwise_comparisons' },
          () => { router.refresh() }
        )
        .subscribe()
      return () => { supabase.removeChannel(channel) }
    }

    const channel = supabase
      .channel(`leaderboard:${eventId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'pool_scores' },
        () => { router.refresh() }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'judge_scores' },
        () => { router.refresh() }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'submissions' },
        () => { router.refresh() }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [eventId, judgingMode, router])

  // Sync when server re-renders (pairwise router.refresh path)
  useEffect(() => {
    setEntries(initialLeaderboard)
  }, [initialLeaderboard])

  if (entries.length === 0) {
    return (
      <div className="card text-center py-16 text-gray-500">
        {judgingMode === 'pairwise'
          ? 'No comparisons yet — judges need to start comparing'
          : 'No HJ results yet — teams appear after repo analysis completes'}
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
            <div className="flex items-center gap-2">
              <div className="font-semibold text-white">{entry.team_name}</div>
              {entry.is_finalist && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-300 border border-purple-500/25">
                  Finalist{entry.finalist_rank ? ` #${entry.finalist_rank}` : ''}
                </span>
              )}
            </div>
            <div className="text-xs text-gray-500">
              {judgingMode === 'pairwise'
                ? `${entry.judge_score_count} comparison${entry.judge_score_count !== 1 ? 's' : ''}`
                : entry.human_score !== null
                  ? `Human final score from ${entry.judge_score_count} rubric score${entry.judge_score_count === 1 ? '' : 's'} · HJ first round #${entry.pool_rank}`
                  : `HJ first round #${entry.pool_rank} · ${entry.percentile}th percentile`}
            </div>
          </div>

          <ProgressRing score={entry.human_score ?? entry.overall_score} size={56} strokeWidth={4} />
        </div>
      ))}
    </div>
  )
}
