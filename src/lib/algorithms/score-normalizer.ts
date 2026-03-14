/**
 * Per-judge score normalization to correct for different judge calibrations.
 * Translates each judge's scores to a common scale using z-score normalization.
 */

export interface RawScore {
  judgeId: string
  submissionId: string
  criteriaKey: string
  score: number
}

export interface NormalizedScore extends RawScore {
  normalizedScore: number
}

/**
 * Normalize scores per judge so each judge's scores have mean=5, std≈2.
 */
export function normalizeJudgeScores(rawScores: RawScore[]): NormalizedScore[] {
  // Group by judge
  const byJudge = new Map<string, RawScore[]>()
  for (const s of rawScores) {
    if (!byJudge.has(s.judgeId)) byJudge.set(s.judgeId, [])
    byJudge.get(s.judgeId)!.push(s)
  }

  const normalized: NormalizedScore[] = []

  for (const [, scores] of Array.from(byJudge)) {
    const values = scores.map((s: RawScore) => s.score)
    const mean = values.reduce((a: number, b: number) => a + b, 0) / values.length
    const std = Math.sqrt(
      values.reduce((sum: number, v: number) => sum + (v - mean) ** 2, 0) / values.length
    )

    for (const s of scores) {
      // If judge has no variance, pass through
      const normalizedScore =
        std < 0.01
          ? s.score
          : Math.round((((s.score - mean) / std) * 2 + 5) * 10) / 10

      // Clamp to [0, 10]
      normalized.push({
        ...s,
        normalizedScore: Math.max(0, Math.min(10, normalizedScore)),
      })
    }
  }

  return normalized
}

/**
 * Compute aggregate score for a submission across all judges with normalization.
 */
export function computeAggregateScore(
  submissionId: string,
  normalizedScores: NormalizedScore[],
  criteriaWeights: Record<string, number>
): number {
  const relevant = normalizedScores.filter((s) => s.submissionId === submissionId)
  if (relevant.length === 0) return 0

  // Average across judges per criteria key
  const byCriteria = new Map<string, number[]>()
  for (const s of relevant) {
    if (!byCriteria.has(s.criteriaKey)) byCriteria.set(s.criteriaKey, [])
    byCriteria.get(s.criteriaKey)!.push(s.normalizedScore)
  }

  let totalWeight = 0
  let weightedSum = 0
  for (const [key, scores] of Array.from(byCriteria)) {
    const avg = scores.reduce((a: number, b: number) => a + b, 0) / scores.length
    const weight = criteriaWeights[key] || 0
    weightedSum += avg * weight
    totalWeight += weight
  }

  if (totalWeight === 0) return 0
  return Math.round((weightedSum / totalWeight) * 10) / 10
}
