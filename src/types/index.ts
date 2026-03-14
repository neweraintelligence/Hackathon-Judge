// ─── Events ───────────────────────────────────────────────────────────────────

export type JudgingMode = 'rubric' | 'pairwise' | 'hybrid'

export interface CriterionConfig {
  key: string
  label: string
  weight: number // 0-1, sum to 1
  description: string
  subQuestions: string[]
}

export interface Event {
  id: string
  name: string
  slug: string
  date: string
  criteria_config: CriterionConfig[]
  judging_mode: JudgingMode
  ai_judge_enabled: boolean
  ai_judge_name: string
  created_at: string
}

// ─── Submissions ───────────────────────────────────────────────────────────────

export type SubmissionStatus = 'pending' | 'analyzing' | 'ready' | 'error'

export interface Submission {
  id: string
  event_id: string
  github_url: string
  devpost_url: string | null
  team_name: string
  pitch_text: string | null
  status: SubmissionStatus
  created_at: string
}

export interface SubmissionMedia {
  id: string
  submission_id: string
  type: 'screenshot' | 'video'
  storage_url: string
  sort_order: number
}

// ─── Judges ───────────────────────────────────────────────────────────────────

export interface Judge {
  id: string
  email: string
  display_name: string | null
  event_id: string
  invite_token: string
  user_id: string | null
  joined_at: string | null
  is_ai_judge: boolean
}

// ─── AI Analysis ──────────────────────────────────────────────────────────────

export type PassName =
  | 'pass1_repo_archaeology'
  | 'pass2_code_deep_dive'
  | 'pass3_innovation_audit'
  | 'pass4_visual_ux'
  | 'pass5_pool_comparison'
  | 'pass6_synthesis'

export type AnalysisStatus = 'pending' | 'running' | 'complete' | 'error'

export interface AIAnalysis {
  id: string
  submission_id: string
  pass_name: PassName
  model_used: string
  thinking_tokens: number | null
  result: Pass1Result | Pass2Result | Pass3Result | Pass4Result | Pass5Result | Pass6Result | null
  status: AnalysisStatus
  error: string | null
  created_at: string
}

// Pass result types
export interface Pass1Result {
  github_url: string
  is_forked: boolean
  file_count: number
  languages: Record<string, number>
  tech_stack: string[]
  template_detected: string | null
  template_confidence: number
  original_code_ratio: number
  commit_count_in_window: number
  commit_authors: string[]
  readme_summary: string
  key_files: string[]
}

export interface Pass2Result {
  architecture_notes: string
  clever_solutions: string[]
  novel_api_integrations: string[]
  creative_moments: string[]
  code_quality_notes: string
  files_analyzed: string[]
  thinking_summary: string
  technical_score_raw: number
  functional_score_raw: number
}

export interface Pass3Result {
  innovation_score: number
  senior_engineer_surprise_factor: 'meh' | 'interesting' | 'impressive' | 'exceptional'
  common_pattern_matches: string[]
  differentiating_factors: string[]
  problem_novelty_notes: string
  thinking_summary: string
}

export interface Pass4Result {
  visual_hierarchy_score: number
  design_consistency_score: number
  ux_flow_score: number
  brand_cohesion_score: number
  overall_visual_score: number
  screenshots_analyzed: number
  ux_commentary: string[]
}

export interface Pass5Result {
  pool_rank: number
  pool_size: number
  percentile: number
  relative_standing: string
  outperforms_pool_on: string[]
  underperforms_pool_on: string[]
  comparable_submissions: string[]
}

export interface Pass6Result {
  criteria_scores: CriterionScore[]
  overall_score: number
  most_impressive_aspect: string
  concerns_and_limitations: string[]
  judge_briefing_points: string[]
  recommended_award_categories: string[]
  confidence: 'low' | 'medium' | 'high'
  thinking_summary: string
}

export interface CriterionScore {
  criteria_key: string
  score: number
  reasoning: string
  confidence: 'low' | 'medium' | 'high'
}

// ─── Scores ───────────────────────────────────────────────────────────────────

export interface AIScore {
  id: string
  submission_id: string
  criteria_key: string
  score: number
  reasoning: string
  confidence: 'low' | 'medium' | 'high'
}

export interface JudgeScore {
  id: string
  submission_id: string
  judge_id: string
  criteria_key: string
  score: number
  comment: string | null
  created_at: string
}

export interface PairwiseComparison {
  id: string
  judge_id: string
  event_id: string
  submission_a_id: string
  submission_b_id: string
  winner_id: string
  criteria_key: string
  created_at: string
}

export interface PoolScore {
  id: string
  submission_id: string
  event_id: string
  overall_score: number
  pool_rank: number
  percentile: number
  computed_at: string
}

// ─── Composite view types ─────────────────────────────────────────────────────

export interface JudgeScoreWithJudge extends JudgeScore {
  judges: Pick<Judge, 'id' | 'display_name' | 'is_ai_judge'>
}

export interface SubmissionWithAnalysis extends Submission {
  ai_analyses: AIAnalysis[]
  ai_scores: AIScore[]
  pool_scores: PoolScore[]
  submission_media: SubmissionMedia[]
  judge_scores: JudgeScoreWithJudge[]
}

export interface LeaderboardEntry {
  submission_id: string
  team_name: string
  overall_score: number
  pool_rank: number
  percentile: number
  judge_score_count: number
}
