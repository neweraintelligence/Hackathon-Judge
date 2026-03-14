'use server'
import { createServiceClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export interface JudgeScoreInput {
  submissionId: string
  judgeId: string
  criteriaKey: string
  score: number
  comment?: string
}

export async function submitJudgeScore(input: JudgeScoreInput): Promise<{ error?: string }> {
  const supabase = createServiceClient()
  const { error } = await supabase
    .from('judge_scores')
    .upsert(
      {
        submission_id: input.submissionId,
        judge_id: input.judgeId,
        criteria_key: input.criteriaKey,
        score: input.score,
        comment: input.comment || null,
      },
      { onConflict: 'submission_id,judge_id,criteria_key' }
    )
  if (error) return { error: error.message }
  revalidatePath(`/submissions/${input.submissionId}`)
  return {}
}

export async function submitPairwiseComparison(data: {
  judgeId: string
  eventId: string
  submissionAId: string
  submissionBId: string
  winnerId: string
  criteriaKey: string
}): Promise<{ error?: string }> {
  const supabase = createServiceClient()
  const { error } = await supabase.from('pairwise_comparisons').insert({
    judge_id: data.judgeId,
    event_id: data.eventId,
    submission_a_id: data.submissionAId,
    submission_b_id: data.submissionBId,
    winner_id: data.winnerId,
    criteria_key: data.criteriaKey,
  })
  if (error) return { error: error.message }
  return {}
}
