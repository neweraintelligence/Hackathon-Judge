'use client'
import { AIJudgeAvatar } from '@/components/ui/AIJudgeAvatar'
import { Badge } from '@/components/ui/Badge'
import { ProgressRing } from '@/components/ui/ProgressRing'
import { DEFAULT_PERSONA } from '@/lib/ai-judge/persona'
import type { JudgeScore, CriterionConfig } from '@/types'

interface Props {
  name: string
  scores: JudgeScore[]
  criteria: CriterionConfig[]
  expanded?: boolean
}

export function AIJudgePanelCard({ name, scores, criteria, expanded = false }: Props) {
  if (scores.length === 0) return null

  const overall =
    scores.reduce((sum, s) => {
      const w = criteria.find((c) => c.key === s.criteria_key)?.weight || 0
      return sum + s.score * w
    }, 0)

  return (
    <div className="glass rounded-2xl border border-purple-500/20 shadow-glow overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-purple-500/10 bg-purple-600/5">
        <AIJudgeAvatar size={44} pulse />
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="font-bold text-white">{name}</span>
            <Badge variant="purple">AI Judge</Badge>
          </div>
          <div className="text-xs text-gray-500 mt-0.5">{DEFAULT_PERSONA.bio.slice(0, 80)}…</div>
        </div>
        <div className="text-right shrink-0">
          <ProgressRing score={overall} size={52} strokeWidth={4} />
          <div className="text-[10px] text-gray-500 mt-0.5">Overall</div>
        </div>
      </div>

      {/* Scores */}
      <div className="divide-y divide-white/[0.04]">
        {criteria.map((criterion) => {
          const judgeScore = scores.find((s) => s.criteria_key === criterion.key)
          if (!judgeScore) return null

          const scoreColor =
            judgeScore.score >= 7
              ? 'text-green-400'
              : judgeScore.score >= 4
              ? 'text-yellow-400'
              : 'text-red-400'

          return (
            <div key={criterion.key} className="px-5 py-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium text-gray-300 mb-1">{criterion.label}</div>
                  {judgeScore.comment && (
                    <p className="text-xs text-gray-500 leading-relaxed italic">
                      "{judgeScore.comment}"
                    </p>
                  )}
                </div>
                <span className={`text-lg font-bold shrink-0 ${scoreColor}`}>
                  {judgeScore.score.toFixed(1)}
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
