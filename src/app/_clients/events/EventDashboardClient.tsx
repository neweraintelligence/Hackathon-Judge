'use client'
import { useState, useEffect, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import type { Event, Submission, Judge, LeaderboardEntry } from '@/types'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { PillTabs } from '@/components/ui/PillTabs'
import { AddSubmissionModal } from '@/app/_clients/submissions/AddSubmissionModal'
import { InviteJudgeModal } from './InviteJudgeModal'
import { AIJudgeToggle } from './AIJudgeToggle'
import { AIJudgeAvatar } from '@/components/ui/AIJudgeAvatar'
import { deleteSubmission, clearAllSubmissions } from '@/lib/actions/submissions'

const STATUS_BADGE: Record<string, { label: string; variant: any }> = {
  pending: { label: 'Pending', variant: 'default' },
  analyzing: { label: 'Analyzing...', variant: 'yellow' },
  ready: { label: 'Ready', variant: 'green' },
  error: { label: 'Error', variant: 'red' },
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

  // Auto-refresh while any submission is still analyzing
  const hasAnalyzing = submissions.some((s) => s.status === 'analyzing' || s.status === 'pending')
  useEffect(() => {
    if (!hasAnalyzing) return
    const id = setInterval(() => router.refresh(), 4000)
    return () => clearInterval(id)
  }, [hasAnalyzing, router])

  const tabs = [
    { key: 'submissions', label: `Submissions (${submissions.length})` },
    { key: 'judges', label: `Judges (${judges.length})` },
    { key: 'leaderboard', label: 'Leaderboard' },
  ]

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      <div className="max-w-5xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-8">
          <Link href="/events" className="text-sm text-gray-500 hover:text-gray-300 mb-2 inline-block">
            ← Events
          </Link>
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white">{event.name}</h1>
              <p className="text-gray-500 text-sm mt-1">
                {new Date(event.date + 'T00:00:00Z').toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' })}
                {' · '}
                <span className="capitalize">{event.judging_mode} mode</span>
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Link href={`/events/${event.slug}/leaderboard`}>
                <Button variant="secondary" size="sm">Live Leaderboard</Button>
              </Link>
              <a href={`/api/export/${event.slug}`} download>
                <Button variant="secondary" size="sm">Export CSV</Button>
              </a>
            </div>
          </div>
        </div>

        <PillTabs
          tabs={tabs}
          activeTab={tab}
          onTabChange={(k) => setTab(k as any)}
          className="mb-6"
        />

        {/* Submissions Tab */}
        {tab === 'submissions' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Button size="sm" onClick={() => setShowAddSubmission(true)}>+ Add Submission</Button>
              {submissions.length > 0 && (
                confirmClearAll ? (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400">Delete all {submissions.length} submissions?</span>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => setConfirmClearAll(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      loading={isPending}
                      onClick={() => startTransition(async () => {
                        await clearAllSubmissions(event.id)
                        setConfirmClearAll(false)
                      })}
                      className="!text-rose-400 !border-rose-500/30 hover:!bg-rose-500/10"
                    >
                      Delete All
                    </Button>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmClearAll(true)}
                    className="text-xs text-gray-600 hover:text-rose-400 transition-colors"
                  >
                    Clear all
                  </button>
                )
              )}
            </div>
            {submissions.length === 0 ? (
              <div className="card text-center py-12 text-gray-500">No submissions yet</div>
            ) : (
              submissions.map((s) => {
                const badge = STATUS_BADGE[s.status] || STATUS_BADGE.pending
                return (
                  <div key={s.id} className="card flex items-center justify-between group">
                    <div>
                      <div className="font-medium text-white mb-0.5">{s.team_name}</div>
                      <div className="text-xs text-gray-500 font-mono truncate max-w-xs">{s.github_url}</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant={badge.variant}>{badge.label}</Badge>
                      {s.status === 'ready' && (
                        <Link href={`/submissions/${s.id}`}>
                          <Button variant="ghost" size="sm">View Report</Button>
                        </Link>
                      )}
                      {(s.status === 'pending' || s.status === 'error') && (
                        <TriggerAnalysisButton submissionId={s.id} label={s.status === 'error' ? 'Retry' : 'Analyze'} />
                      )}
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
          <div className="space-y-3">
            {/* AI Judge toggle — always at top */}
            <AIJudgeToggle
              eventId={event.id}
              eventSlug={event.slug}
              enabled={event.ai_judge_enabled ?? false}
              judgeCount={judges.filter((j) => !j.is_ai_judge).length}
              name={event.ai_judge_name || 'Avatar Judge'}
            />

            <div className="flex items-center justify-between pt-1">
              <div className="label">Human Judges</div>
              <Button size="sm" onClick={() => setShowInviteJudge(true)}>+ Invite Judge</Button>
            </div>

            {judges.filter((j) => !j.is_ai_judge).length === 0 ? (
              <div className="card text-center py-8 text-gray-500 text-sm">No human judges invited yet</div>
            ) : (
              judges.filter((j) => !j.is_ai_judge).map((j) => (
                <div key={j.id} className="card flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-sm font-bold text-gray-400">
                      {(j.display_name || j.email)[0].toUpperCase()}
                    </div>
                    <div>
                      <div className="font-medium text-white">{j.display_name || j.email}</div>
                      <div className="text-xs text-gray-500">{j.email}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {j.joined_at ? (
                      <Badge variant="green">Joined</Badge>
                    ) : (
                      <Badge variant="yellow">Invited</Badge>
                    )}
                    <CopyInviteLinkButton token={j.invite_token} />
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Leaderboard Tab */}
        {tab === 'leaderboard' && (
          <div className="space-y-2">
            {leaderboard.length === 0 ? (
              <div className="card text-center py-12 text-gray-500">
                No scores yet — analysis and judging must complete first
              </div>
            ) : (
              leaderboard.map((entry, i) => (
                <div key={entry.submission_id} className="card flex items-center gap-4">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
                      i === 0 ? 'bg-yellow-500/20 text-yellow-400' :
                      i === 1 ? 'bg-gray-400/20 text-gray-300' :
                      i === 2 ? 'bg-orange-600/20 text-orange-400' :
                      'bg-white/5 text-gray-500'
                    }`}
                  >
                    {entry.pool_rank}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-white">{entry.team_name}</div>
                    <div className="text-xs text-gray-500">Top {100 - entry.percentile + 1}th percentile</div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-purple-400">{entry.overall_score.toFixed(1)}</div>
                    <div className="text-xs text-gray-500">/ 10</div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {showAddSubmission && (
        <AddSubmissionModal
          eventId={event.id}
          onClose={() => setShowAddSubmission(false)}
        />
      )}
      {showInviteJudge && (
        <InviteJudgeModal
          eventId={event.id}
          onClose={() => setShowInviteJudge(false)}
        />
      )}
    </div>
  )
}

// ─── Inline small components ──────────────────────────────────────────────────

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

  if (done) return <Badge variant="yellow">Analyzing...</Badge>
  return (
    <Button size="sm" variant="secondary" loading={loading} onClick={trigger}>
      {label}
    </Button>
  )
}

function DeleteSubmissionButton({ submissionId }: { submissionId: string }) {
  const [confirm, setConfirm] = useState(false)
  const [loading, setLoading] = useState(false)

  if (confirm) {
    return (
      <div className="flex items-center gap-1">
        <button
          onClick={() => setConfirm(false)}
          className="text-xs text-gray-500 hover:text-gray-300 px-1"
        >
          Cancel
        </button>
        <button
          disabled={loading}
          onClick={async () => {
            setLoading(true)
            await deleteSubmission(submissionId)
          }}
          className="text-xs text-rose-400 hover:text-rose-300 font-medium px-1 disabled:opacity-50"
        >
          {loading ? '…' : 'Delete'}
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={() => setConfirm(true)}
      className="text-gray-700 hover:text-rose-400 transition-colors opacity-0 group-hover:opacity-100 text-sm px-1"
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
    <Button size="sm" variant="ghost" onClick={copy}>
      {copied ? 'Copied!' : 'Copy Link'}
    </Button>
  )
}
