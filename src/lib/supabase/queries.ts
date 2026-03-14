import { createClient, createServiceClient } from './server'
import type {
  Event,
  Submission,
  SubmissionWithAnalysis,
  Judge,
  AIAnalysis,
  PoolScore,
  LeaderboardEntry,
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
