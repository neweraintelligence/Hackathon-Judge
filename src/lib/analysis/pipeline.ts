import { createServiceClient } from '@/lib/supabase/server'
import { runPass1 } from './passes/pass1'
import { runPass2 } from './passes/pass2'
import { runPass3 } from './passes/pass3'
import { runPass4 } from './passes/pass4'
import { runPass5 } from './passes/pass5'
import { runPass6 } from './passes/pass6'
import { ensureAIJudge, submitAIJudgeScores } from '@/lib/ai-judge/submit-scores'
import type { PassName, CriterionConfig, Pass1Result, Pass2Result, Pass3Result } from '@/types'

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

async function savePassResult(
  submissionId: string,
  passName: PassName,
  model: string,
  result: unknown,
  thinkingTokens?: number
) {
  const supabase = createServiceClient()
  await supabase.from('ai_analyses').upsert(
    {
      submission_id: submissionId,
      pass_name: passName,
      model_used: model,
      result,
      thinking_tokens: thinkingTokens || null,
      status: 'complete',
      error: null,
    },
    { onConflict: 'submission_id,pass_name' }
  )
}

async function setPassStatus(submissionId: string, passName: PassName, status: string) {
  const supabase = createServiceClient()
  await supabase.from('ai_analyses').upsert(
    {
      submission_id: submissionId,
      pass_name: passName,
      model_used: '',
      status,
      result: null,
      error: null,
    },
    { onConflict: 'submission_id,pass_name' }
  )
}

async function setPassError(submissionId: string, passName: PassName, error: unknown) {
  const supabase = createServiceClient()
  await supabase.from('ai_analyses').upsert(
    {
      submission_id: submissionId,
      pass_name: passName,
      model_used: '',
      status: 'error',
      result: null,
      error: getErrorMessage(error),
    },
    { onConflict: 'submission_id,pass_name' }
  )
}

async function saveAIScores(submissionId: string, pass6Result: any) {
  const supabase = createServiceClient()
  if (!pass6Result.criteria_scores) return
  const rows = pass6Result.criteria_scores.map((cs: any) => ({
    submission_id: submissionId,
    criteria_key: cs.criteria_key,
    score: cs.score,
    reasoning: cs.reasoning,
    confidence: cs.confidence,
  }))
  await supabase
    .from('ai_scores')
    .upsert(rows, { onConflict: 'submission_id,criteria_key' })
}

async function savePoolScore(
  submissionId: string,
  eventId: string,
  overallScore: number
) {
  const supabase = createServiceClient()
  await supabase.from('pool_scores').upsert(
    {
      submission_id: submissionId,
      event_id: eventId,
      overall_score: overallScore,
      pool_rank: 1,
      percentile: 100,
      computed_at: new Date().toISOString(),
    },
    { onConflict: 'submission_id' }
  )

  await recomputePoolScoreRanks(eventId)
}

async function recomputePoolScoreRanks(eventId: string) {
  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('pool_scores')
    .select('submission_id, overall_score')
    .eq('event_id', eventId)

  if (error) throw error

  const scores = (data || [])
    .map((row) => ({
      submissionId: row.submission_id as string,
      overallScore: Number(row.overall_score),
    }))
    .filter((row) => Number.isFinite(row.overallScore))

  if (scores.length === 0) return

  const updates = scores.map((row) => {
    const betterCount = scores.filter((other) => other.overallScore > row.overallScore).length

    return {
      submission_id: row.submissionId,
      event_id: eventId,
      overall_score: row.overallScore,
      pool_rank: betterCount + 1,
      percentile: scores.length > 1
        ? Math.round(((scores.length - betterCount - 1) / (scores.length - 1)) * 100)
        : 100,
      computed_at: new Date().toISOString(),
    }
  })

  const { error: upsertError } = await supabase
    .from('pool_scores')
    .upsert(updates, { onConflict: 'submission_id' })

  if (upsertError) throw upsertError
}

export async function runFullPipeline(
  submissionId: string,
  eventId: string,
  githubUrl: string,
  teamName: string,
  criteria: CriterionConfig[],
  screenshotUrls: string[] = []
) {
  const supabase = createServiceClient()
  let currentPass: PassName | null = null

  // Update submission status
  await supabase
    .from('submissions')
    .update({ status: 'analyzing' })
    .eq('id', submissionId)

  try {
    // Pass 1 — Repo Archaeology
    currentPass = 'pass1_repo_archaeology'
    console.log(`[pipeline] ${submissionId} starting pass1`)
    await setPassStatus(submissionId, currentPass, 'running')
    const pass1 = await runPass1(githubUrl)
    await savePassResult(submissionId, currentPass, 'claude-sonnet-4-6', pass1)
    console.log(`[pipeline] ${submissionId} pass1 done`)

    // Pass 2 — Code Deep Dive
    currentPass = 'pass2_code_deep_dive'
    console.log(`[pipeline] ${submissionId} starting pass2`)
    await setPassStatus(submissionId, currentPass, 'running')
    const pass2 = await runPass2(githubUrl, pass1)
    await savePassResult(submissionId, currentPass, 'claude-sonnet-4-6', pass2)
    console.log(`[pipeline] ${submissionId} pass2 done`)

    // Pass 3 — Innovation Audit
    currentPass = 'pass3_innovation_audit'
    console.log(`[pipeline] ${submissionId} starting pass3`)
    await setPassStatus(submissionId, currentPass, 'running')
    const pass3 = await runPass3(pass1, pass2)
    await savePassResult(submissionId, currentPass, 'claude-sonnet-4-6', pass3)
    console.log(`[pipeline] ${submissionId} pass3 done`)

    // Pass 4 — Visual/UX (only if screenshots exist)
    currentPass = 'pass4_visual_ux'
    console.log(`[pipeline] ${submissionId} starting pass4`)
    let pass4 = null
    await setPassStatus(submissionId, currentPass, 'running')
    pass4 = await runPass4(screenshotUrls)
    await savePassResult(submissionId, currentPass, 'claude-sonnet-4-6', pass4)
    console.log(`[pipeline] ${submissionId} pass4 done`)

    // Pass 5 — Pool Comparison (fetch pool from DB)
    currentPass = 'pass5_pool_comparison'
    console.log(`[pipeline] ${submissionId} starting pass5`)
    await setPassStatus(submissionId, currentPass, 'running')
    const { data: poolData } = await supabase
      .from('ai_analyses')
      .select(`
        submission_id,
        pass_name,
        result,
        submissions!inner(team_name, event_id)
      `)
      .eq('submissions.event_id', eventId)
      .eq('status', 'complete')
      .neq('submission_id', submissionId)

    // Build pool entries from pass1/2/3 data
    const poolMap: Record<string, any> = {}
    for (const row of poolData || []) {
      const sid = row.submission_id
      if (!poolMap[sid]) poolMap[sid] = { submissionId: sid, teamName: (row as any).submissions.team_name }
      poolMap[sid][row.pass_name] = row.result
    }
    const pool = Object.values(poolMap).filter(
      (e: any) => e.pass1_repo_archaeology && e.pass2_code_deep_dive && e.pass3_innovation_audit
    ).map((e: any) => ({
      submissionId: e.submissionId,
      teamName: e.teamName,
      pass1: e.pass1_repo_archaeology as Pass1Result,
      pass2: e.pass2_code_deep_dive as Pass2Result,
      pass3: e.pass3_innovation_audit as Pass3Result,
    }))

    const pass5 = await runPass5(
      { submissionId, teamName, pass1, pass2, pass3 },
      pool
    )
    await savePassResult(submissionId, currentPass, 'claude-sonnet-4-6', pass5)
    console.log(`[pipeline] ${submissionId} pass5 done`)

    // Pass 6 — Synthesis
    currentPass = 'pass6_synthesis'
    console.log(`[pipeline] ${submissionId} starting pass6`)
    await setPassStatus(submissionId, currentPass, 'running')
    const pass6 = await runPass6(teamName, criteria, pass1, pass2, pass3, pass4, pass5)
    await savePassResult(submissionId, currentPass, 'claude-opus-4-6', pass6)
    console.log(`[pipeline] ${submissionId} pass6 done`)

    // Save ai_scores from pass6
    await saveAIScores(submissionId, pass6)

    // Auto-submit AI judge scores if enabled for this event
    const { data: eventRow } = await supabase
      .from('events')
      .select('ai_judge_enabled, ai_judge_name, criteria_config')
      .eq('id', eventId)
      .single()

    if (eventRow?.ai_judge_enabled) {
      try {
        const aiJudgeId = await ensureAIJudge(eventId, eventRow.ai_judge_name || 'Avatar Judge')
        await submitAIJudgeScores(
          submissionId,
          aiJudgeId,
          pass6,
          eventRow.criteria_config || criteria
        )
      } catch (err) {
        console.error('AI judge score submission failed:', err)
        // Non-fatal — don't block the rest of the pipeline
      }
    }

    // Save pool score
    await savePoolScore(
      submissionId,
      eventId,
      pass6.overall_score
    )

    // Mark submission ready
    await supabase
      .from('submissions')
      .update({ status: 'ready' })
      .eq('id', submissionId)

  } catch (error) {
    console.error(`[pipeline] ${submissionId} failed${currentPass ? ` at ${currentPass}` : ''}:`, error)
    if (currentPass) {
      await setPassError(submissionId, currentPass, error)
    }
    await supabase
      .from('submissions')
      .update({ status: 'error' })
      .eq('id', submissionId)
    throw error
  }
}
