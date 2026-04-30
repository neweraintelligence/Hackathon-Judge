'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import type { SubmissionWithAnalysis, Pass1Result, Pass6Result } from '@/types'
import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { ProgressRing } from '@/components/ui/ProgressRing'
import { CriteriaBreakdown } from '@/components/ui/CriteriaBreakdown'
import { AnalysisPipelineProgress } from './AnalysisPipelineProgress'
import { AIJudgePanelCard } from '@/app/_clients/judge/AIJudgePanelCard'
import { StreamingAvatar } from '@/components/ui/StreamingAvatar'
import { HeyGenAvatar } from '@/components/ui/HeyGenAvatar'
import { AvatarProviderPicker, type AvatarProvider } from '@/components/ui/AvatarProviderPicker'
import { TopNav } from '@/components/ui/TopNav'
import { DEFAULT_CRITERIA } from '@/lib/constants/criteria'

interface Props {
  submission: SubmissionWithAnalysis
  aiJudgeName?: string
}

export function SubmissionReportClient({ submission, aiJudgeName: aiJudgeNameProp }: Props) {
  const router = useRouter()
  const pass1 = submission.ai_analyses.find((a) => a.pass_name === 'pass1_repo_archaeology')?.result as Pass1Result | null
  const pass6 = submission.ai_analyses.find((a) => a.pass_name === 'pass6_synthesis')?.result as Pass6Result | null
  const poolScore = submission.pool_scores?.[0]

  const techStack = pass1?.tech_stack || []
  const isReady = submission.status === 'ready'
  const isAnalyzing = submission.status === 'analyzing'

  const aiJudgeScores = (submission.judge_scores || []).filter((s) => s.judges?.is_ai_judge)
  const aiJudgeName = aiJudgeNameProp || 'Avatar Judge'
  const [showPicker, setShowPicker] = useState(false)
  const [avatarProvider, setAvatarProvider] = useState<AvatarProvider | null>(null)
  const canHearAvatarJudge = Boolean(pass6) && isReady

  return (
    <>
      {showPicker && (
        <AvatarProviderPicker
          onSelect={(p) => { setShowPicker(false); setAvatarProvider(p) }}
          onCancel={() => setShowPicker(false)}
        />
      )}
      {avatarProvider === 'did' && (
        <StreamingAvatar
          submission={submission}
          judgeName={aiJudgeName}
          onClose={() => setAvatarProvider(null)}
        />
      )}
      {avatarProvider === 'heygen' && (
        <HeyGenAvatar
          submission={submission}
          judgeName={aiJudgeName}
          onClose={() => setAvatarProvider(null)}
        />
      )}

      <TopNav
        actions={
          canHearAvatarJudge ? (
            <button
              onClick={() => setShowPicker(true)}
              className="btn-purple"
              style={{ fontSize: 12 }}
            >
              <span className="live-dot" style={{ background: 'var(--purple2)' }} />
              Hear from Avatar Judge
            </button>
          ) : undefined
        }
      />

      <div style={{ maxWidth: 860, margin: '0 auto', padding: '44px 24px' }}>
        <div className="anim-fade-up">

          {/* Back */}
          <button
            onClick={() => router.back()}
            className="btn-ghost"
            style={{ padding: '5px 0', fontSize: 13, marginBottom: 14 }}
          >
            ← Back
          </button>

          {/* Title block */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 20, marginBottom: 28, paddingTop: 4 }}>
            <div style={{ flex: 1 }}>
              <div className="label" style={{ marginBottom: 10 }}>Submission Report</div>
              <h1 style={{ fontSize: 30, fontWeight: 700, letterSpacing: '-0.025em', marginBottom: 12, color: 'var(--text)' }}>
                {submission.team_name}
              </h1>
              {(() => {
                const parts = (() => { try { const p = new URL(submission.github_url).pathname.split('/').filter(Boolean); return p.length >= 2 ? { owner: p[0], repo: p[1] } : null } catch { return null } })()
                return parts ? (
                  <div style={{ fontSize: 13, color: 'var(--muted2)', marginBottom: 10 }}>
                    <span style={{ opacity: 0.5 }}>by</span>{' '}
                    <span style={{ color: 'var(--text)', fontWeight: 500 }}>@{parts.owner}</span>
                    <span style={{ opacity: 0.35, margin: '0 6px' }}>·</span>
                    <span style={{ fontStyle: 'italic' }}>{parts.repo}</span>
                  </div>
                ) : null
              })()}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, alignItems: 'center' }}>
                <a
                  href={submission.github_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mono"
                  style={{ fontSize: 12, color: 'var(--accent2)', textDecoration: 'none' }}
                >
                  {submission.github_url.replace('https://github.com/', 'github/')}
                </a>
                {techStack.slice(0, 5).map((t) => (
                  <span key={t} className="badge badge-default">{t}</span>
                ))}
              </div>
            </div>
            {poolScore && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                <ProgressRing score={poolScore.overall_score} size={86} strokeWidth={5} />
                <div style={{ fontSize: 11, color: 'var(--muted)', textAlign: 'center' }}>
                  #{poolScore.pool_rank} · {poolScore.percentile}th percentile
                </div>
              </div>
            )}
          </div>

          {/* Analysis progress */}
          {(isAnalyzing || !isReady) && (
            <div className="card" style={{ marginBottom: 16 }}>
              <div className="label" style={{ marginBottom: 12 }}>Analysis Pipeline</div>
              <AnalysisPipelineProgress
                submissionId={submission.id}
                initialAnalyses={submission.ai_analyses}
              />
            </div>
          )}

          {pass6 && (
            <>
              {/* Most impressive */}
              {pass6.most_impressive_aspect && (
                <div className="card" style={{ marginBottom: 10, background: 'rgba(124,92,252,0.055)', border: '1px solid rgba(124,92,252,0.17)', position: 'relative', overflow: 'hidden' }}>
                  <div style={{ position: 'absolute', top: 0, right: 0, width: 260, height: 160, background: 'radial-gradient(ellipse at top right, rgba(124,92,252,0.1), transparent 70%)', pointerEvents: 'none' }} />
                  <div className="label" style={{ color: 'var(--purple2)', marginBottom: 10 }}>Most Impressive</div>
                  <p style={{ fontSize: 14, color: '#d0d0e8', lineHeight: 1.75 }}>
                    {pass6.most_impressive_aspect}
                  </p>
                </div>
              )}

              {/* 2-column: Criteria | Concerns + Briefing */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
                {/* Left: Criteria */}
                <div className="card">
                  <div className="label" style={{ marginBottom: 16 }}>Criteria Scores</div>
                  <CriteriaBreakdown
                    scores={submission.ai_scores}
                    criteria={DEFAULT_CRITERIA}
                  />
                </div>

                {/* Right: Concerns + Judge Briefing */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {pass6.concerns_and_limitations?.length > 0 && (
                    <div className="card" style={{ flex: 1 }}>
                      <div className="label" style={{ marginBottom: 12 }}>Concerns</div>
                      <ul style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {pass6.concerns_and_limitations.map((c, i) => (
                          <li key={i} style={{ display: 'flex', gap: 8, fontSize: 13, color: 'var(--muted2)', listStyle: 'none' }}>
                            <span style={{ color: 'var(--red)', flexShrink: 0, marginTop: 1, fontSize: 10 }}>▸</span>
                            {c}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {pass6.judge_briefing_points?.length > 0 && (
                    <div className="card" style={{ flex: 1 }}>
                      <div className="label" style={{ marginBottom: 12 }}>Judge Briefing</div>
                      <ul style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {pass6.judge_briefing_points.map((p, i) => (
                          <li key={i} style={{ display: 'flex', gap: 8, fontSize: 13, color: 'var(--muted2)', listStyle: 'none' }}>
                            <span style={{ color: 'var(--purple)', fontWeight: 700, flexShrink: 0 }}>{i + 1}.</span>
                            {p}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>

              {/* Awards + Repo Stats */}
              {(pass6.recommended_award_categories?.length > 0 || pass1) && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
                  {pass6.recommended_award_categories?.length > 0 && (
                    <div className="card">
                      <div className="label" style={{ marginBottom: 12 }}>Recommended Awards</div>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {pass6.recommended_award_categories.map((cat) => (
                          <span key={cat} className="badge badge-purple">🏆 {cat}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {pass1 && (
                    <div className="card">
                      <div className="label" style={{ marginBottom: 12 }}>Repo Stats</div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        {[
                          { l: 'Files',    v: pass1.file_count },
                          { l: 'Commits',  v: pass1.commit_count_in_window },
                          { l: 'Original', v: `${Math.round(pass1.original_code_ratio * 100)}%` },
                          { l: 'Template', v: pass1.template_detected || 'None' },
                        ].map((s) => (
                          <div key={s.l}>
                            <div className="label" style={{ marginBottom: 4, fontSize: 9 }}>{s.l}</div>
                            <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text)' }}>{s.v}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* AI Judge Panel Card */}
              {aiJudgeScores.length > 0 && (
                <AIJudgePanelCard
                  name={aiJudgeName}
                  scores={aiJudgeScores}
                  criteria={DEFAULT_CRITERIA}
                />
              )}
            </>
          )}

          {/* Repo stats standalone (if no pass6) */}
          {pass1 && !pass6 && (
            <div className="card" style={{ marginTop: 16 }}>
              <div className="label" style={{ marginBottom: 12 }}>Repo Stats</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16 }}>
                {[
                  { label: 'Files', value: pass1.file_count },
                  { label: 'Commits (window)', value: pass1.commit_count_in_window },
                  { label: 'Original Code', value: `${Math.round(pass1.original_code_ratio * 100)}%` },
                  { label: 'Template', value: pass1.template_detected || 'None detected' },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <div className="label" style={{ marginBottom: 4 }}>{label}</div>
                    <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text)' }}>{value}</div>
                  </div>
                ))}
              </div>
              {pass1.readme_summary && (
                <div style={{ marginTop: 16 }}>
                  <div className="label" style={{ marginBottom: 4 }}>README Summary</div>
                  <p style={{ color: 'var(--muted2)', fontSize: 13 }}>{pass1.readme_summary}</p>
                </div>
              )}
            </div>
          )}

          {/* Screenshots */}
          {submission.submission_media?.filter((m) => m.type === 'screenshot').length > 0 && (
            <div className="card" style={{ marginTop: 10 }}>
              <div className="label" style={{ marginBottom: 12 }}>Screenshots</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {submission.submission_media
                  .filter((m) => m.type === 'screenshot')
                  .sort((a, b) => a.sort_order - b.sort_order)
                  .map((m) => (
                    <img
                      key={m.id}
                      src={m.storage_url}
                      alt="Screenshot"
                      style={{ borderRadius: 10, border: '1px solid var(--border)', width: '100%', objectFit: 'cover' }}
                    />
                  ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
