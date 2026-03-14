import type { CriterionScore, CriterionConfig } from '@/types'
import { ProgressRing } from './ProgressRing'
import { Badge } from './Badge'

interface CriteriaBreakdownProps {
  scores: CriterionScore[]
  criteria: CriterionConfig[]
}

export function CriteriaBreakdown({ scores, criteria }: CriteriaBreakdownProps) {
  return (
    <div className="space-y-4">
      {criteria.map((criterion) => {
        const score = scores.find((s) => s.criteria_key === criterion.key)
        if (!score) return null
        return (
          <div key={criterion.key} className="glass rounded-xl p-4 border border-white/[0.06]">
            <div className="flex items-start gap-4">
              <ProgressRing score={score.score} size={52} strokeWidth={4} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-white text-sm">{criterion.label}</span>
                  <span className="text-[10px] text-gray-500 uppercase tracking-wider">
                    {Math.round(criterion.weight * 100)}%
                  </span>
                  <Badge
                    variant={
                      score.confidence === 'high'
                        ? 'green'
                        : score.confidence === 'medium'
                        ? 'yellow'
                        : 'red'
                    }
                  >
                    {score.confidence}
                  </Badge>
                </div>
                <p className="text-gray-400 text-xs leading-relaxed">{score.reasoning}</p>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
