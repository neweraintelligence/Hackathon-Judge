import type { SubmissionWithAnalysis, Pass6Result, JudgeScoreWithJudge } from '@/types'

export function buildSummaryScript(submission: SubmissionWithAnalysis): string {
  const pass6 = submission.ai_analyses.find(
    (a) => a.pass_name === 'pass6_synthesis'
  )?.result as Pass6Result | null

  if (!pass6) {
    return `I haven't finished my analysis of ${submission.team_name} yet. Check back when the pipeline completes.`
  }

  const parts: string[] = [`${submission.team_name}.`]

  if (pass6.most_impressive_aspect) {
    parts.push(pass6.most_impressive_aspect)
  }
  if (pass6.judge_briefing_points?.length > 0) {
    parts.push(`For the panel: ${pass6.judge_briefing_points[0]}`)
    if (pass6.judge_briefing_points[1]) parts.push(pass6.judge_briefing_points[1])
  }
  if (pass6.concerns_and_limitations?.length > 0) {
    parts.push(`Worth probing: ${pass6.concerns_and_limitations[0]}`)
  }

  return parts.join(' ')
}

export function buildCriterionScript(
  criteriaKey: string,
  submission: SubmissionWithAnalysis
): string {
  const aiScore = submission.judge_scores?.find(
    (s: JudgeScoreWithJudge) => s.criteria_key === criteriaKey && s.judges?.is_ai_judge
  )
  if (aiScore?.comment) return aiScore.comment

  const pass6 = submission.ai_analyses.find(
    (a) => a.pass_name === 'pass6_synthesis'
  )?.result as Pass6Result | null
  const score = pass6?.criteria_scores?.find((s) => s.criteria_key === criteriaKey)
  if (score?.reasoning) return score.reasoning

  return `I don't have a specific assessment for this criterion yet.`
}
