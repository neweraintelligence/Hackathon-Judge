'use client'
import type { SubmissionWithAnalysis, Pass6Result, Pass1Result, JudgeScore } from '@/types'
import { Badge } from '@/components/ui/Badge'
import { ProgressRing } from '@/components/ui/ProgressRing'
import { CriteriaBreakdown } from '@/components/ui/CriteriaBreakdown'
import { AIJudgePanelCard } from './AIJudgePanelCard'
import { DEFAULT_CRITERIA } from '@/lib/constants/criteria'

interface Props {
  submission: SubmissionWithAnalysis
}

export function AIReportPanel({ submission }: Props) {
  const pass6 = submission.ai_analyses.find((a) => a.pass_name === 'pass6_synthesis')?.result as Pass6Result | null
  const pass1 = submission.ai_analyses.find((a) => a.pass_name === 'pass1_repo_archaeology')?.result as Pass1Result | null
  const poolScore = submission.pool_scores?.[0]

  // Find AI judge scores (judge_scores rows from the AI judge)
  // We detect them via the comment style — or ideally pass judge info down
  // For now surface them from ai_scores as the canonical source
  const aiJudgeScoresRaw = (submission as SubmissionWithAnalysis & {
    ai_judge_scores?: Array<{ criteria_key: string; score: number; comment?: string | null }>
  }).ai_judge_scores
  const aiJudgeScores: JudgeScore[] = (aiJudgeScoresRaw || []).map((s, i) => ({
    id: `ai-judge-${submission.id}-${s.criteria_key}-${i}`,
    submission_id: submission.id,
    judge_id: 'ai-judge',
    criteria_key: s.criteria_key,
    score: s.score,
    comment: s.comment ?? null,
    created_at: new Date(0).toISOString(),
  }))

  if (!pass6) {
    return (
      <div className="card fade-up space-y-4">
        <div className="label">AI Analysis</div>
        <div className="space-y-3">
          <div className="skeleton h-4 w-1/3 rounded-md" />
          <div className="skeleton h-3 w-full rounded-md" />
          <div className="skeleton h-3 w-11/12 rounded-md" />
          <div className="skeleton h-3 w-10/12 rounded-md" />
        </div>
        <p className="text-sm text-gray-400">Analysis is still running. This panel will populate automatically once complete.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4 pr-1 max-h-[calc(100vh-200px)] fade-up">
      <div className="card">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="label mb-1">AI Judge Report</div>
            <div className="font-bold text-white text-2xl tracking-tight">{submission.team_name}</div>
            <div className="text-sm text-gray-400 mt-1">Automated synthesis and rubric insights for judge decision support.</div>
          </div>
          {poolScore && (
            <div className="text-right shrink-0">
              <ProgressRing score={poolScore.overall_score} size={72} strokeWidth={5} />
              <div className="text-xs text-gray-400 mt-2">
                #{poolScore.pool_rank} in pool
              </div>
            </div>
          )}
        </div>
        {pass1?.tech_stack && (
          <div className="mt-4 flex flex-wrap gap-1.5">
            {pass1.tech_stack.slice(0, 6).map((t) => (
              <Badge key={t} variant="default">{t}</Badge>
            ))}
          </div>
        )}
      </div>

      {pass6.most_impressive_aspect && (
        <div className="card border-indigo-300/20">
          <div className="label text-indigo-200 mb-2">Most Impressive</div>
          <p className="text-gray-100 text-sm leading-relaxed">{pass6.most_impressive_aspect}</p>
        </div>
      )}

      <div className="space-y-2">
        <div className="label">AI Scores</div>
        <CriteriaBreakdown scores={submission.ai_scores} criteria={DEFAULT_CRITERIA} />
      </div>

      {pass6.judge_briefing_points?.length > 0 && (
        <div className="card">
          <div className="label mb-3">Discussion Points</div>
          <ul className="space-y-1.5">
            {pass6.judge_briefing_points.map((p, i) => (
              <li key={i} className="text-sm text-gray-300 flex items-start gap-2.5">
                <span className="mt-[3px] h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-300" />
                <span>{p}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {pass6.concerns_and_limitations?.length > 0 && (
        <div className="card border-rose-300/20">
          <div className="label mb-3 text-rose-200">Concerns and Limitations</div>
          <ul className="space-y-2">
            {pass6.concerns_and_limitations.map((c, i) => (
              <li key={i} className="text-sm text-gray-300 flex items-start gap-2.5">
                <span className="mt-[3px] h-1.5 w-1.5 shrink-0 rounded-full bg-rose-300" />
                <span>{c}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {aiJudgeScores?.length ? (
        <AIJudgePanelCard
          name="AI Judge"
          scores={aiJudgeScores}
          criteria={DEFAULT_CRITERIA}
          expanded
        />
      ) : null}
    </div>
  )
}
