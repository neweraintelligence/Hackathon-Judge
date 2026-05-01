'use client'
import { useState, useMemo } from 'react'
import type { Event, Submission, PairwiseComparison } from '@/types'
import { PairwisePanel } from './PairwisePanel'
import { DEFAULT_CRITERIA } from '@/lib/constants/criteria'

interface Props {
  event: Event
  submissions: Submission[]
  judgeId: string | null
  completedComparisons: PairwiseComparison[]
}

type Pair = [Submission, Submission]

function buildAllPairs(submissions: Submission[]): Pair[] {
  const pairs: Pair[] = []
  for (let i = 0; i < submissions.length; i++) {
    for (let j = i + 1; j < submissions.length; j++) {
      pairs.push([submissions[i], submissions[j]])
    }
  }
  return pairs
}

function buildDonePairKeys(comparisons: PairwiseComparison[], criteriaCount: number): Set<string> {
  const countByKey = new Map<string, number>()
  for (const comp of comparisons) {
    const key = [comp.submission_a_id, comp.submission_b_id].sort().join('|')
    countByKey.set(key, (countByKey.get(key) ?? 0) + 1)
  }
  const done = new Set<string>()
  for (const [key, count] of countByKey) {
    if (count >= criteriaCount) done.add(key)
  }
  return done
}

function pickRandom<T>(arr: T[]): T | null {
  if (arr.length === 0) return null
  return arr[Math.floor(Math.random() * arr.length)]
}

export function PairwiseJudgeQueueClient({ event, submissions, judgeId, completedComparisons }: Props) {
  const criteria = event.criteria_config || DEFAULT_CRITERIA

  const allPairs = useMemo(() => buildAllPairs(submissions), [submissions])

  const [donePairKeys, setDonePairKeys] = useState<Set<string>>(() =>
    buildDonePairKeys(completedComparisons, criteria.length)
  )

  const [currentPair, setCurrentPair] = useState<Pair | null>(() => {
    const done = buildDonePairKeys(completedComparisons, criteria.length)
    const allP = buildAllPairs(submissions)
    const available = allP.filter(([a, b]) => !done.has([a.id, b.id].sort().join('|')))
    return pickRandom(available)
  })

  function handlePairDone() {
    if (!currentPair) return
    const key = [currentPair[0].id, currentPair[1].id].sort().join('|')
    const newDone = new Set(donePairKeys)
    newDone.add(key)
    setDonePairKeys(newDone)

    const remaining = allPairs.filter(([a, b]) => !newDone.has([a.id, b.id].sort().join('|')))
    setCurrentPair(pickRandom(remaining))
  }

  if (!judgeId) {
    return (
      <div className="card text-center py-16 text-gray-400 fade-up">
        <div className="text-sm uppercase tracking-[0.2em] text-gray-500 mb-2">Sign In Required</div>
        You need to sign in as a judge to participate in pairwise judging.
      </div>
    )
  }

  if (submissions.length < 2) {
    return (
      <div className="card text-center py-16 text-gray-400 fade-up">
        <div className="text-sm uppercase tracking-[0.2em] text-gray-500 mb-2">Not Enough Submissions</div>
        At least 2 ready submissions are needed for pairwise judging.
      </div>
    )
  }

  const totalPairs = allPairs.length
  const completedCount = donePairKeys.size
  const progress = totalPairs > 0 ? (completedCount / totalPairs) * 100 : 0

  if (!currentPair) {
    return (
      <div className="card text-center py-16 fade-up">
        <div className="text-sm uppercase tracking-[0.2em] text-green-500 mb-3">All Done</div>
        <div className="text-white font-semibold text-lg">You've compared all {totalPairs} pairs</div>
        <div className="text-gray-500 text-sm mt-2">
          Your comparisons are recorded. Check the leaderboard to see the rankings.
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-5 fade-up">
      <div className="flex items-center justify-between text-sm">
        <div className="text-gray-500">
          <span className="text-white font-medium">{completedCount}</span>
          {' '}of{' '}
          <span className="text-white font-medium">{totalPairs}</span>
          {' '}pairs compared
        </div>
        <div className="text-xs text-gray-600">{totalPairs - completedCount} remaining</div>
      </div>

      <div className="w-full bg-white/5 rounded-full h-1">
        <div
          className="bg-purple-500 h-1 rounded-full transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="card">
        <PairwisePanel
          event={event}
          submissionA={currentPair[0]}
          submissionB={currentPair[1]}
          judgeId={judgeId}
          onDone={handlePairDone}
        />
      </div>
    </div>
  )
}
