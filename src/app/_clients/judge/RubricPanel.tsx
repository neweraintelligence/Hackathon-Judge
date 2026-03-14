'use client'
import { useState, useTransition } from 'react'
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
  const [isPending, startTransition] = useTransition()

  function handleSubmit() {
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
    })
  }

  if (saved) {
    return (
      <div className="text-center py-12 space-y-3">
        <div className="text-4xl">✅</div>
        <div className="text-white font-medium">Scores submitted!</div>
        <div className="text-gray-400 text-sm">Your scores for {submission.team_name} have been saved.</div>
      </div>
    )
  }

  if (!judgeId) {
    return (
      <div className="text-center py-8 text-gray-500 text-sm">
        Sign in to submit scores
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div className="label">Your Scores</div>

      {criteria.map((c) => (
        <div key={c.key} className="space-y-2">
          <ScoreSlider
            label={c.label}
            value={scores[c.key] || 5}
            onChange={(v) => setScores((prev) => ({ ...prev, [c.key]: v }))}
          />
          <textarea
            className="input text-xs min-h-[48px] resize-none"
            placeholder={`Comment on ${c.label.toLowerCase()}... (optional)`}
            value={comments[c.key] || ''}
            onChange={(e) => setComments((prev) => ({ ...prev, [c.key]: e.target.value }))}
          />
        </div>
      ))}

      <Button onClick={handleSubmit} loading={isPending} className="w-full">
        Submit Scores
      </Button>
    </div>
  )
}
