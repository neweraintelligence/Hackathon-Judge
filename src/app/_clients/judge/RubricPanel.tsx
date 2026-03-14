'use client'
import { useState, useTransition } from 'react'
import Link from 'next/link'
import type { Event, SubmissionWithAnalysis } from '@/types'
import { submitJudgeScore } from '@/lib/actions/scoring'
import { DEFAULT_CRITERIA } from '@/lib/constants/criteria'
import { ScoreSlider } from '@/components/ui/ScoreSlider'
import { Button } from '@/components/ui/Button'

interface Props {
  event: Event
  submission: SubmissionWithAnalysis
  judgeId?: string
}

export function RubricPanel({ event, submission, judgeId }: Props) {
  const criteria = event.criteria_config || DEFAULT_CRITERIA
  const [scores, setScores] = useState<Record<string, number>>(
    Object.fromEntries(criteria.map((c) => [c.key, 5]))
  )
  const [comments, setComments] = useState<Record<string, string>>({})
  const [saved, setSaved] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [isPending, startTransition] = useTransition()
  const averageScore = criteria.reduce((sum, criterion) => sum + (scores[criterion.key] || 0), 0) / criteria.length

  function submitScores() {
    if (!judgeId) return
    startTransition(async () => {
      for (const criterion of criteria) {
        await submitJudgeScore({
          submissionId: submission.id,
          judgeId,
          criteriaKey: criterion.key,
          score: scores[criterion.key] || 5,
          comment: comments[criterion.key] || undefined,
        })
      }
      setSaved(true)
      setShowConfirm(false)
    })
  }

  if (saved) {
    return (
      <div className="card text-center py-12 space-y-4 fade-up">
        <div className="mx-auto h-11 w-11 rounded-full bg-emerald-500/20 border border-emerald-300/35 flex items-center justify-center">
          <div className="h-5 w-5 rounded-full bg-emerald-300/80" />
        </div>
        <div className="text-white font-semibold text-lg tracking-tight">Scores submitted</div>
        <div className="text-gray-400 text-sm">Your evaluation for {submission.team_name} has been saved.</div>
        <div className="flex justify-center pt-2">
          <Link href={`/events/${event.slug}/judge`}>
            <Button variant="secondary">Return to queue</Button>
          </Link>
        </div>
      </div>
    )
  }

  if (!judgeId) {
    return (
      <div className="card text-center py-10 text-gray-400 text-sm">
        Sign in to submit scores for this submission.
      </div>
    )
  }

  return (
    <div className="space-y-5 fade-up">
      <div className="card">
        <div className="flex items-end justify-between gap-4">
          <div>
            <div className="label mb-1">Your Evaluation</div>
            <div className="text-white text-lg font-semibold tracking-tight">Submit scorecard for {submission.team_name}</div>
          </div>
          <div className="text-right shrink-0">
            <div className="text-2xl font-semibold text-indigo-200">{averageScore.toFixed(1)}</div>
            <div className="text-[11px] uppercase tracking-[0.16em] text-gray-500">Average</div>
          </div>
        </div>
      </div>

      {criteria.map((c) => (
        <div key={c.key} className="card space-y-3">
          <ScoreSlider
            label={c.label}
            value={scores[c.key] || 5}
            onChange={(v) => setScores((prev) => ({ ...prev, [c.key]: v }))}
          />
          <textarea
            className="input text-xs min-h-[70px] resize-none"
            placeholder={`Comment on ${c.label.toLowerCase()}... (optional)`}
            value={comments[c.key] || ''}
            onChange={(e) => setComments((prev) => ({ ...prev, [c.key]: e.target.value }))}
          />
        </div>
      ))}

      <Button onClick={() => setShowConfirm(true)} loading={isPending} className="w-full">
        Submit Scores
      </Button>

      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm overlay-fade">
          <div className="card pop-in w-full max-w-md space-y-4">
            <div>
              <div className="label mb-1">Confirm Submission</div>
              <h3 className="text-white text-lg font-semibold tracking-tight">Lock in scores for {submission.team_name}?</h3>
            </div>
            <p className="text-sm text-gray-400">
              This sends all rubric scores and comments. You can still resubmit later, but this will be recorded immediately.
            </p>
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3 text-sm flex items-center justify-between">
              <span className="text-gray-400">Average score</span>
              <span className="font-semibold text-indigo-200">{averageScore.toFixed(1)} / 10</span>
            </div>
            <div className="flex gap-2 pt-1">
              <Button variant="secondary" className="flex-1" onClick={() => setShowConfirm(false)}>
                Cancel
              </Button>
              <Button className="flex-1" onClick={submitScores} loading={isPending}>
                Confirm and Submit
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
