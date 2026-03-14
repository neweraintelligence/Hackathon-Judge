'use client'
import { useState, useTransition } from 'react'
import type { Event, Submission } from '@/types'
import { submitPairwiseComparison } from '@/lib/actions/scoring'
import { DEFAULT_CRITERIA } from '@/lib/constants/criteria'
import { Button } from '@/components/ui/Button'

interface Props {
  event: Event
  submissionA: Submission
  submissionB: Submission
  judgeId: string
  onDone: () => void
}

export function PairwisePanel({ event, submissionA, submissionB, judgeId, onDone }: Props) {
  const criteria = event.criteria_config || DEFAULT_CRITERIA
  const [criteriaIndex, setCriteriaIndex] = useState(0)
  const [isPending, startTransition] = useTransition()

  const currentCriterion = criteria[criteriaIndex]

  function pickWinner(winnerId: string) {
    startTransition(async () => {
      await submitPairwiseComparison({
        judgeId,
        eventId: event.id,
        submissionAId: submissionA.id,
        submissionBId: submissionB.id,
        winnerId,
        criteriaKey: currentCriterion.key,
      })
      if (criteriaIndex + 1 < criteria.length) {
        setCriteriaIndex((i) => i + 1)
      } else {
        onDone()
      }
    })
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="label mb-1">
          {criteriaIndex + 1} / {criteria.length}
        </div>
        <h3 className="font-bold text-white text-lg">{currentCriterion.label}</h3>
        <p className="text-gray-500 text-sm mt-0.5">{currentCriterion.description}</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {[submissionA, submissionB].map((sub) => (
          <button
            key={sub.id}
            disabled={isPending}
            onClick={() => pickWinner(sub.id)}
            className="card hover:border-purple-500/40 hover:shadow-glow transition-all duration-150 text-left group"
          >
            <div className="font-semibold text-white mb-1 group-hover:text-purple-300 transition-colors">
              {sub.team_name}
            </div>
            {sub.pitch_text && (
              <div className="text-gray-500 text-xs line-clamp-3">{sub.pitch_text}</div>
            )}
            <div className="mt-3 text-xs text-purple-400 opacity-0 group-hover:opacity-100 transition-opacity">
              Select →
            </div>
          </button>
        ))}
      </div>

      <div className="text-center">
        <Button variant="ghost" size="sm" onClick={onDone}>
          Skip
        </Button>
      </div>
    </div>
  )
}
