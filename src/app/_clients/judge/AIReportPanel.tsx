'use client'
import type { SubmissionWithAnalysis, Pass6Result, Pass1Result } from '@/types'
import { Badge } from '@/components/ui/Badge'
import { ProgressRing } from '@/components/ui/ProgressRing'
import { CriteriaBreakdown } from '@/components/ui/CriteriaBreakdown'
import { DEFAULT_CRITERIA } from '@/lib/constants/criteria'

interface Props {
  submission: SubmissionWithAnalysis
}

export function AIReportPanel({ submission }: Props) {
  const pass6 = submission.ai_analyses.find((a) => a.pass_name === 'pass6_synthesis')?.result as Pass6Result | null
  const pass1 = submission.ai_analyses.find((a) => a.pass_name === 'pass1_repo_archaeology')?.result as Pass1Result | null
  const poolScore = submission.pool_scores?.[0]

  if (!pass6) {
    return (
      <div className="text-center py-12 text-gray-500">
        <div className="text-2xl mb-2">🤔</div>
        AI analysis not complete yet
      </div>
    )
  }

  return (
    <div className="space-y-4 overflow-y-auto pr-1 max-h-[calc(100vh-200px)]">
      {/* Score header */}
      <div className="flex items-center gap-4">
        {poolScore && <ProgressRing score={poolScore.overall_score} size={64} strokeWidth={5} />}
        <div>
          <div className="font-bold text-white text-lg">{submission.team_name}</div>
          {poolScore && (
            <div className="text-sm text-gray-400">
              #{poolScore.pool_rank} · {poolScore.percentile}th percentile
            </div>
          )}
          {pass1?.tech_stack && (
            <div className="flex flex-wrap gap-1 mt-1">
              {pass1.tech_stack.slice(0, 4).map((t) => (
                <Badge key={t} variant="default">{t}</Badge>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Most impressive */}
      {pass6.most_impressive_aspect && (
        <div className="bg-purple-600/10 border border-purple-500/20 rounded-xl p-3">
          <div className="label text-purple-400 mb-1">Most Impressive</div>
          <p className="text-gray-200 text-sm leading-relaxed">{pass6.most_impressive_aspect}</p>
        </div>
      )}

      {/* Criteria breakdown */}
      <div>
        <div className="label mb-2">AI Scores</div>
        <CriteriaBreakdown scores={submission.ai_scores} criteria={DEFAULT_CRITERIA} />
      </div>

      {/* Judge briefing */}
      {pass6.judge_briefing_points?.length > 0 && (
        <div>
          <div className="label mb-2">Discussion Points</div>
          <ul className="space-y-1.5">
            {pass6.judge_briefing_points.map((p, i) => (
              <li key={i} className="text-sm text-gray-400 flex items-start gap-1.5">
                <span className="text-purple-400 shrink-0">{i + 1}.</span>
                {p}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Concerns */}
      {pass6.concerns_and_limitations?.length > 0 && (
        <div>
          <div className="label mb-2">Concerns</div>
          <ul className="space-y-1">
            {pass6.concerns_and_limitations.map((c, i) => (
              <li key={i} className="text-sm text-gray-400 flex items-start gap-1.5">
                <span className="text-red-400 shrink-0">·</span>
                {c}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
