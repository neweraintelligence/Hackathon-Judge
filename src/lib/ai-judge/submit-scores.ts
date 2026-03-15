import Anthropic from '@anthropic-ai/sdk'
import { createServiceClient } from '@/lib/supabase/server'
import { buildPersonaPrompt, DEFAULT_PERSONA, type AIJudgePersona } from './persona'
import { MODELS } from '@/lib/constants/models'
import type { Pass6Result, CriterionConfig } from '@/types'

/**
 * Create or fetch the AI judge row for this event.
 */
export async function ensureAIJudge(eventId: string, name: string): Promise<string> {
  const supabase = createServiceClient()
  const token = `ai-judge-${eventId}`

  const { data: existing } = await supabase
    .from('judges')
    .select('id')
    .eq('invite_token', token)
    .single()

  if (existing) return existing.id

  const { data, error } = await supabase
    .from('judges')
    .insert({
      email: 'aria@judging.internal',
      display_name: name,
      event_id: eventId,
      invite_token: token,
      is_ai_judge: true,
      joined_at: new Date().toISOString(),
      ai_persona: DEFAULT_PERSONA,
    })
    .select('id')
    .single()

  if (error) throw error
  return data.id
}

/**
 * Submit AI judge scores for a submission from Pass 6 results.
 * Rewrites each criterion comment into Aria's first-person voice.
 */
export async function submitAIJudgeScores(
  submissionId: string,
  judgeId: string,
  pass6: Pass6Result,
  criteria: CriterionConfig[],
  persona: AIJudgePersona = DEFAULT_PERSONA
): Promise<void> {
  const supabase = createServiceClient()
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  for (const cs of pass6.criteria_scores) {
    const criterion = criteria.find((c) => c.key === cs.criteria_key)
    if (!criterion) continue

    // Rewrite reasoning in Aria's voice
    let comment = cs.reasoning
    try {
      const res = await client.messages.create({
        model: MODELS.SONNET,
        max_tokens: 256,
        messages: [
          {
            role: 'user',
            content: buildPersonaPrompt(criterion.label, cs.score, cs.reasoning, persona),
          },
        ],
      })
      comment = res.content.find((b) => b.type === 'text')?.text || cs.reasoning
    } catch {
      // fallback to original reasoning
    }

    await supabase.from('judge_scores').upsert(
      {
        submission_id: submissionId,
        judge_id: judgeId,
        criteria_key: cs.criteria_key,
        score: cs.score,
        comment,
      },
      { onConflict: 'submission_id,judge_id,criteria_key' }
    )
  }
}
