import { createServiceClient } from '@/lib/supabase/server'
import { runPass1 } from './passes/pass1'
import { runPass2 } from './passes/pass2'
import { runPass3 } from './passes/pass3'
import { runPass4 } from './passes/pass4'
import { runPass5 } from './passes/pass5'
import { runPass6 } from './passes/pass6'
import type { PassName, CriterionConfig, Pass1Result, Pass2Result, Pass3Result } from '@/types'

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
  overallScore: number,
  poolRank: number,
  percentile: number
) {
  const supabase = createServiceClient()
  await supabase.from('pool_scores').upsert(
    {
      submission_id: submissionId,
      event_id: eventId,
      overall_score: overallScore,
      pool_rank: poolRank,
      percentile,
      computed_at: new Date().toISOString(),
    },
    { onConflict: 'submission_id' }
  )
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

  // Update submission status
  await supabase
    .from('submissions')
    .update({ status: 'analyzing' })
    .eq('id', submissionId)

  try {
    // Pass 1 — Repo Archaeology
    await setPassStatus(submissionId, 'pass1_repo_archaeology', 'running')
    const pass1 = await runPass1(githubUrl)
    await savePassResult(submissionId, 'pass1_repo_archaeology', 'claude-sonnet-4-6', pass1)

    // Pass 2 — Code Deep Dive
    await setPassStatus(submissionId, 'pass2_code_deep_dive', 'running')
    const pass2 = await runPass2(githubUrl, pass1)
    await savePassResult(submissionId, 'pass2_code_deep_dive', 'claude-opus-4-6', pass2)

    // Pass 3 — Innovation Audit
    await setPassStatus(submissionId, 'pass3_innovation_audit', 'running')
    const pass3 = await runPass3(pass1, pass2)
    await savePassResult(submissionId, 'pass3_innovation_audit', 'claude-opus-4-6', pass3)

    // Pass 4 — Visual/UX (only if screenshots exist)
    let pass4 = null
    await setPassStatus(submissionId, 'pass4_visual_ux', 'running')
    pass4 = await runPass4(screenshotUrls)
    await savePassResult(submissionId, 'pass4_visual_ux', 'claude-sonnet-4-6', pass4)

    // Pass 5 — Pool Comparison (fetch pool from DB)
    await setPassStatus(submissionId, 'pass5_pool_comparison', 'running')
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

    const pass5 = await runPass5(submissionId, teamName, pool)
    await savePassResult(submissionId, 'pass5_pool_comparison', 'claude-sonnet-4-6', pass5)

    // Pass 6 — Synthesis
    await setPassStatus(submissionId, 'pass6_synthesis', 'running')
    const pass6 = await runPass6(teamName, criteria, pass1, pass2, pass3, pass4, pass5)
    await savePassResult(submissionId, 'pass6_synthesis', 'claude-opus-4-6', pass6)

    // Save ai_scores from pass6
    await saveAIScores(submissionId, pass6)

    // Save pool score
    await savePoolScore(
      submissionId,
      eventId,
      pass6.overall_score,
      pass5.pool_rank,
      pass5.percentile
    )

    // Mark submission ready
    await supabase
      .from('submissions')
      .update({ status: 'ready' })
      .eq('id', submissionId)

  } catch (error) {
    await supabase
      .from('submissions')
      .update({ status: 'error' })
      .eq('id', submissionId)
    throw error
  }
}
