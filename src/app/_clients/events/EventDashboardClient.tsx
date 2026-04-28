'use client'
import { useState, useEffect, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import type { Event, Submission, Judge, LeaderboardEntry } from '@/types'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { AddSubmissionModal } from '@/app/_clients/submissions/AddSubmissionModal'
import { InviteJudgeModal } from './InviteJudgeModal'
import { AIJudgeToggle } from './AIJudgeToggle'
import { deleteSubmission, clearAllSubmissions } from '@/lib/actions/submissions'
import { TopNav } from '@/components/ui/TopNav'

const STATUS_MAP: Record<string, { label: string; cls: string }> = {
  pending:   { label: 'Pending',      cls: 'badge badge-default' },
  analyzing: { label: 'Analyzing…',   cls: 'badge badge-yellow' },
  ready:     { label: 'Ready',        cls: 'badge badge-green' },
  error:     { label: 'Error',        cls: 'badge badge-red' },
}

interface Props {
  event: Event
  submissions: Submission[]
  judges: Judge[]
  leaderboard: LeaderboardEntry[]
}

export function EventDashboardClient({ event, submissions, judges, leaderboard }: Props) {
  const router = useRouter()
  const [tab, setTab] = useState<'submissions' | 'judges' | 'leaderboard'>('submissions')
  const [showAddSubmission, setShowAddSubmission] = useState(false)
  const [showInviteJudge, setShowInviteJudge] = useState(false)
  const [confirmClearAll, setConfirmClearAll] = useState(false)
  const [isPending, startTransition] = useTransition()

  const hasAnalyzing = submissions.some((s) => s.status === 'analyzing' || s.status === 'pending')
  useEffect(() => {
    if (!hasAnalyzing) return
    const id = setInterval(() => router.refresh(), 4000)
    return () => clearInterval(id)
  }, [hasAnalyzing, router])

  const readyCount = submissions.filter((s) => s.status === 'ready').length
  const humanJudges = judges.filter((j) => !j.is_ai_judge)
  const avgScore = leaderboard.length > 0
    ? (leaderboard.reduce((s, e) => s + e.overall_score, 0) / leaderboard.length).toFixed(1)
    : '–'

  const eventDate = new Date(event.date + 'T00:00:00Z').toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC',
  })

  const tabs = [
    { key: 'submissions', label: `Submissions (${submissions.length})` },
    { key: 'judges',      label: `Judges (${judges.length})` },
    { key: 'leaderboard', label: 'Leaderboard' },
  ]

  return (
    <>
      <TopNav
        actions={
          <>
            <Link href="/events" className="btn-ghost" style={{ fontSize: 12 }}>Events</Link>
            <Link href="/events/new" className="btn-ghost" style={{ fontSize: 12 }}>+ New Event</Link>
          </>
        }
      />

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '44px 24px' }}>
        <div className="anim-fade-up">

          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28 }}>
            <div>
              <div className="label" style={{ marginBottom: 8 }}>
                <Link href="/events" style={{ color: 'inherit', textDecoration: 'none' }}>← Events</Link>
              </div>
              <h1 style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.025em', marginBottom: 5, color: 'var(--text)' }}>
                {event.name}
              </h1>
              <p style={{ fontSize: 13, color: 'var(--muted)' }}>
                {eventDate} · <span style={{ textTransform: 'capitalize' }}>{event.judging_mode} mode</span>
              </p>
            </div>
            <div style={{ display: 'flex', gap: 8, paddingTop: 4 }}>
              <Link href={`/events/${event.slug}/leaderboard`} className="btn-secondary" style={{ fontSize: 12 }}>
                Live Leaderboard
              </Link>
              <a href={`/api/export/${event.slug}`} download className="btn-secondary" style={{ fontSize: 12 }}>
                Export CSV
              </a>
            </div>
          </div>

          {/* Stats row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginBottom: 28 }}>
            {[
              { label: 'Submissions', value: submissions.length, color: 'var(--accent2)' },
              { label: 'Ready',       value: readyCount,          color: 'var(--green)' },
              { label: 'Judges',      value: judges.length,       color: 'var(--purple2)' },
              { label: 'Avg Score',   value: avgScore,            color: 'var(--yellow)' },
            ].map((s) => (
              <div key={s.label} className="card" style={{ padding: '14px 18px' }}>
                <div className="label" style={{ marginBottom: 6 }}>{s.label}</div>
                <div style={{ fontSize: 26, fontWeight: 700, color: s.color, letterSpacing: '-0.02em' }}>{s.value}</div>
              </div>
            ))}
          </div>

          {/* Tabs */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: 'inline-flex', gap: 3, background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', borderRadius: 10, padding: 3 }}>
              {tabs.map((t) => (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key as any)}
                  style={{ fontFamily: 'inherit', fontSize: 13, fontWeight: 500, padding: '6px 16px', borderRadius: 7, border: 'none', cursor: 'pointer', transition: 'all 0.18s' }}
                  className={tab === t.key ? 'pill-tab-active' : 'pill-tab-inactive'}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Submissions Tab */}
          {tab === 'submissions' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                <button className="btn-primary" style={{ fontSize: 12 }} onClick={() => setShowAddSubmission(true)}>
                  + Add Submission
                </button>
                {submissions.length > 0 && (
                  confirmClearAll ? (
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <span style={{ fontSize: 12, color: 'var(--muted)' }}>
                        Delete all {submissions.length} submissions?
                      </span>
                      <button className="btn-ghost" style={{ fontSize: 12 }} onClick={() => setConfirmClearAll(false)}>
                        Cancel
                      </button>
                      <button
                        style={{ fontSize: 12, padding: '4px 10px', borderRadius: 6, border: 'none', cursor: 'pointer', background: 'rgba(240,96,128,0.1)', color: 'var(--red)', fontFamily: 'inherit', opacity: isPending ? 0.5 : 1 }}
                        disabled={isPending}
                        onClick={() => startTransition(async () => {
                          await clearAllSubmissions(event.id)
                          setConfirmClearAll(false)
                        })}
                      >
                        {isPending ? '…' : 'Delete All'}
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmClearAll(true)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 12, color: 'var(--muted)' }}
                    >
                      Clear all
                    </button>
                  )
                )}
              </div>

              {submissions.length === 0 ? (
                <div className="card" style={{ textAlign: 'center', padding: '48px 24px', color: 'var(--muted)' }}>
                  No submissions yet
                </div>
              ) : (
                submissions.map((s, i) => {
                  const st = STATUS_MAP[s.status] || STATUS_MAP.pending
                  const gh = parseGithubUrl(s.github_url)
                  return (
                    <div
                      key={s.id}
                      className="card"
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
                        animation: `fadeUp 0.32s ${i * 0.055}s cubic-bezier(0.16,1,0.3,1) both`,
                      }}
                    >
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 3, color: 'var(--text)' }}>
                          {s.team_name}
                        </div>
                        {gh && (
                          <div style={{ fontSize: 12, color: 'var(--muted2)', marginBottom: 2 }}>
                            <span style={{ opacity: 0.55 }}>by</span> @{gh.owner} · <span style={{ fontStyle: 'italic' }}>{gh.repo}</span>
                          </div>
                        )}
                        <div className="mono" style={{ fontSize: 11, color: 'var(--muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 380 }}>
                          {s.github_url}
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                        <span className={st.cls}>{st.label}</span>
                        {s.status === 'ready' && (
                          <Link href={`/submissions/${s.id}`} className="btn-ghost" style={{ fontSize: 12 }}>
                            View Report
                          </Link>
                        )}
                        {(s.status === 'pending' || s.status === 'error') && (
                          <TriggerAnalysisButton submissionId={s.id} label={s.status === 'error' ? 'Retry' : 'Analyze'} />
                        )}
                        {s.status === 'analyzing' && <AnalyzingSpinner />}
                        <DeleteSubmissionButton submissionId={s.id} />
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          )}

          {/* Judges Tab */}
          {tab === 'judges' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <AIJudgeToggle
                eventId={event.id}
                eventSlug={event.slug}
                enabled={event.ai_judge_enabled ?? false}
                judgeCount={humanJudges.length}
                name={event.ai_judge_name || 'Avatar Judge'}
              />

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 0' }}>
                <div className="label">Human Judges</div>
                <button className="btn-primary" style={{ fontSize: 12 }} onClick={() => setShowInviteJudge(true)}>
                  + Invite Judge
                </button>
              </div>

              {humanJudges.length === 0 ? (
                <div className="card" style={{ textAlign: 'center', padding: '32px 24px', color: 'var(--muted)', fontSize: 14 }}>
                  No human judges invited yet
                </div>
              ) : (
                humanJudges.map((j, i) => (
                  <div key={j.id} className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', animation: `fadeUp 0.32s ${i * 0.08}s cubic-bezier(0.16,1,0.3,1) both` }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{
                        width: 38, height: 38, borderRadius: '50%', flexShrink: 0,
                        background: `linear-gradient(135deg, hsl(${i * 80 + 200},60%,35%), hsl(${i * 80 + 240},60%,28%))`,
                        border: '1px solid rgba(255,255,255,0.06)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontWeight: 700, fontSize: 14, color: 'var(--text)',
                      }}>
                        {(j.display_name || j.email)[0].toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 2, color: 'var(--text)' }}>
                          {j.display_name || j.email}
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--muted)' }}>{j.email}</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span className={j.joined_at ? 'badge badge-green' : 'badge badge-yellow'}>
                        {j.joined_at ? 'Joined' : 'Invited'}
                      </span>
                      <CopyInviteLinkButton token={j.invite_token} />
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Leaderboard Tab */}
          {tab === 'leaderboard' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {leaderboard.length === 0 ? (
                <div className="card" style={{ textAlign: 'center', padding: '48px 24px', color: 'var(--muted)' }}>
                  No scores yet — analysis and judging must complete first
                </div>
              ) : (
                leaderboard.map((entry, i) => {
                  const rankCls = i === 0 ? 'rank-1' : i === 1 ? 'rank-2' : i === 2 ? 'rank-3' : 'rank-n'
                  const scoreColor = entry.overall_score >= 9 ? 'var(--green)' : entry.overall_score >= 8 ? 'var(--purple2)' : 'var(--yellow)'
                  return (
                    <div
                      key={entry.submission_id}
                      className="card"
                      style={{ display: 'flex', alignItems: 'center', gap: 16, animation: `fadeUp 0.32s ${i * 0.07}s cubic-bezier(0.16,1,0.3,1) both` }}
                    >
                      <div className={rankCls} style={{ width: 34, height: 34, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 14, flexShrink: 0 }}>
                        {entry.pool_rank}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 3, color: 'var(--text)' }}>
                          {entry.team_name}
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--muted)' }}>
                          {entry.percentile}th percentile
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em', color: scoreColor }}>
                          {entry.overall_score.toFixed(1)}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--muted)' }}>/10</div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          )}
        </div>
      </div>

      {showAddSubmission && (
        <AddSubmissionModal eventId={event.id} onClose={() => setShowAddSubmission(false)} />
      )}
      {showInviteJudge && (
        <InviteJudgeModal eventId={event.id} onClose={() => setShowInviteJudge(false)} />
      )}
    </>
  )
}

// ─── Inline helpers ───────────────────────────────────────────────────────────

function parseGithubUrl(url: string): { owner: string; repo: string } | null {
  try {
    const parts = new URL(url).pathname.split('/').filter(Boolean)
    if (parts.length >= 2) return { owner: parts[0], repo: parts[1] }
  } catch {}
  return null
}

function AnalyzingSpinner() {
  return (
    <div style={{ width: 15, height: 15, border: '2px solid rgba(255,255,255,0.08)', borderTopColor: 'var(--accent2)', borderRadius: '50%', animation: 'spin 0.75s linear infinite', flexShrink: 0 }} />
  )
}

function TriggerAnalysisButton({ submissionId, label = 'Analyze' }: { submissionId: string; label?: string }) {
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  async function trigger() {
    setLoading(true)
    try {
      await fetch('/api/analysis/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ submissionId }),
      })
      setDone(true)
    } finally {
      setLoading(false)
    }
  }

  if (done) return <span className="badge badge-yellow">Analyzing…</span>
  return (
    <button
      className="btn-secondary"
      style={{ fontSize: 12, padding: '4px 10px', opacity: loading ? 0.7 : 1 }}
      disabled={loading}
      onClick={trigger}
    >
      {loading ? '…' : label}
    </button>
  )
}

function DeleteSubmissionButton({ submissionId }: { submissionId: string }) {
  const [confirm, setConfirm] = useState(false)
  const [loading, setLoading] = useState(false)

  if (confirm) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <button
          onClick={() => setConfirm(false)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 12, color: 'var(--muted)', padding: '2px 6px' }}
        >
          Cancel
        </button>
        <button
          disabled={loading}
          onClick={async () => {
            setLoading(true)
            await deleteSubmission(submissionId)
          }}
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 12, color: 'var(--red)', fontWeight: 500, padding: '2px 6px', opacity: loading ? 0.5 : 1 }}
        >
          {loading ? '…' : 'Delete'}
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={() => setConfirm(true)}
      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', opacity: 0.3, fontSize: 13, padding: '4px 6px', transition: 'opacity 0.18s, color 0.18s' }}
      onMouseEnter={(e) => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.color = 'var(--red)' }}
      onMouseLeave={(e) => { e.currentTarget.style.opacity = '0.3'; e.currentTarget.style.color = 'var(--muted)' }}
      title="Delete submission"
    >
      ✕
    </button>
  )
}

function CopyInviteLinkButton({ token }: { token: string }) {
  const [copied, setCopied] = useState(false)

  async function copy() {
    const url = `${window.location.origin}/join/${token}`
    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button className="btn-ghost" style={{ fontSize: 12 }} onClick={copy}>
      {copied ? 'Copied!' : 'Copy Link'}
    </button>
  )
}
