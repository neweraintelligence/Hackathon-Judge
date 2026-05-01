import { createClient, createServiceClient } from './server'
import { computeRankings } from '@/lib/algorithms/crowd-bt'
import type {
  Event,
  Submission,
  SubmissionWithAnalysis,
  Judge,
  AIAnalysis,
  PoolScore,
  LeaderboardEntry,
  PairwiseComparison,
} from '@/types'

// ─── Events ───────────────────────────────────────────────────────────────────

export async function getEvents(): Promise<Event[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .order('date', { ascending: false })
  if (error) throw error
  return data as Event[]
}

export async function getEventBySlug(slug: string): Promise<Event | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('slug', slug)
    .single()
  if (error) return null
  return data as Event
}

export async function getEventByIdMinimal(eventId: string): Promise<{ ai_judge_name: string | null } | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('events')
    .select('ai_judge_name')
    .eq('id', eventId)
    .single()
  if (error) return null
  return data
}

// ─── Submissions ───────────────────────────────────────────────────────────────

export async function getSubmissions(eventId: string): Promise<Submission[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('submissions')
    .select('*')
    .eq('event_id', eventId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data as Submission[]
}

export async function getSubmissionWithAnalysis(
  submissionId: string
): Promise<SubmissionWithAnalysis | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('submissions')
    .select(`
      *,
      ai_analyses(*),
      ai_scores(*),
      pool_scores(*),
      submission_media(*),
      judge_scores(
        *,
        judges(id, display_name, is_ai_judge)
      )
    `)
    .eq('id', submissionId)
    .single()
  if (error) return null
  return data as SubmissionWithAnalysis
}

// ─── Judges ───────────────────────────────────────────────────────────────────

export async function getJudges(eventId: string): Promise<Judge[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('judges')
    .select('*')
    .eq('event_id', eventId)
    .order('created_at', { ascending: true })
  if (error) throw error
  return data as Judge[]
}

export async function getJudgeByToken(token: string): Promise<Judge | null> {
  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('judges')
    .select('*')
    .eq('invite_token', token)
    .single()
  if (error) return null
  return data as Judge
}

// ─── AI Analyses ──────────────────────────────────────────────────────────────

export async function getAnalysesForSubmission(
  submissionId: string
): Promise<AIAnalysis[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('ai_analyses')
    .select('*')
    .eq('submission_id', submissionId)
    .order('created_at', { ascending: true })
  if (error) throw error
  return data as AIAnalysis[]
}

// ─── Leaderboard ──────────────────────────────────────────────────────────────

export async function getLeaderboard(eventId: string): Promise<LeaderboardEntry[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('pool_scores')
    .select(`
      submission_id,
      overall_score,
      pool_rank,
      percentile,
      submissions!inner(team_name, event_id)
    `)
    .eq('submissions.event_id', eventId)
    .order('pool_rank', { ascending: true })
  if (error) throw error

  return (data ?? []).map((row: any) => ({
    submission_id: row.submission_id,
    team_name: row.submissions.team_name,
    overall_score: row.overall_score,
    pool_rank: row.pool_rank,
    percentile: row.percentile,
    judge_score_count: 0,
  }))
}

// ─── Pairwise ─────────────────────────────────────────────────────────────────

export async function getJudgeForEvent(eventId: string): Promise<Judge | null> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data, error } = await supabase
    .from('judges')
    .select('*')
    .eq('event_id', eventId)
    .eq('user_id', user.id)
    .single()
  if (error) return null
  return data as Judge
}

export async function getPairwiseComparisons(eventId: string): Promise<PairwiseComparison[]> {
  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('pairwise_comparisons')
    .select('*')
    .eq('event_id', eventId)
  if (error) throw error
  return (data ?? []) as PairwiseComparison[]
}

export async function getPairwiseRankings(eventId: string): Promise<LeaderboardEntry[]> {
  const [submissions, comparisons] = await Promise.all([
    getSubmissions(eventId),
    getPairwiseComparisons(eventId),
  ])

  const ready = submissions.filter(s => s.status === 'ready')
  if (ready.length === 0 || comparisons.length === 0) return []

  const rankings = computeRankings(
    ready.map(s => s.id),
    comparisons.map(c => ({
      winnerId: c.winner_id,
      loserId: c.winner_id === c.submission_a_id ? c.submission_b_id : c.submission_a_id,
    }))
  )

  const subMap = new Map(ready.map(s => [s.id, s]))
  const n = rankings.length

  return rankings.map(r => ({
    submission_id: r.id,
    team_name: subMap.get(r.id)?.team_name ?? 'Unknown',
    overall_score: r.score,
    pool_rank: r.rank,
    percentile: Math.round(((n - r.rank) / Math.max(n - 1, 1)) * 100),
    judge_score_count: comparisons.filter(
      c => c.submission_a_id === r.id || c.submission_b_id === r.id
    ).length,
  }))
}

// ─── Pool scores (service role) ───────────────────────────────────────────────

export async function getAllAnalysesForEvent(eventId: string): Promise<AIAnalysis[]> {
  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('ai_analyses')
    .select(`
      *,
      submissions!inner(event_id)
    `)
    .eq('submissions.event_id', eventId)
    .eq('status', 'complete')
  if (error) throw error
  return data as AIAnalysis[]
}
