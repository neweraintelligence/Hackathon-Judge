/**
 * Crowd-BT algorithm for pairwise comparison ranking.
 * Based on: "Crowdsourcing Annotations for Visual Object Detection" (Chen et al.)
 * Simplified implementation for hackathon judging.
 */

export interface CrowdBTItem {
  id: string
  mu: number    // mean skill estimate (higher = better)
  sigma2: number // variance
}

const ALPHA = 1.0  // prior: beta distribution alpha
const BETA = 1.0   // prior: beta distribution beta
const KAPPA = 0.1  // regularization

export function initItem(id: string): CrowdBTItem {
  return { id, mu: 0, sigma2: 1 }
}

/**
 * Update estimates given that winner beat loser in one comparison.
 */
export function updateComparison(
  winner: CrowdBTItem,
  loser: CrowdBTItem
): { winner: CrowdBTItem; loser: CrowdBTItem } {
  const c = Math.sqrt(winner.sigma2 + loser.sigma2)
  const tW = winner.mu / c
  const tL = loser.mu / c

  // Cumulative normal
  const phi = gaussianCDF(tW - tL)
  const safePhi = Math.max(phi, 1e-7)

  // Update mu
  const delta = gaussianPDF(tW - tL) / safePhi
  const newWinnerMu = winner.mu + (winner.sigma2 / c) * delta
  const newLoserMu = loser.mu - (loser.sigma2 / c) * delta

  // Update sigma2
  const kappa = delta * (delta + tW - tL)
  const newWinnerSigma2 = winner.sigma2 * (1 - (winner.sigma2 / (c * c)) * kappa)
  const newLoserSigma2 = loser.sigma2 * (1 - (loser.sigma2 / (c * c)) * kappa)

  return {
    winner: { ...winner, mu: newWinnerMu, sigma2: Math.max(newWinnerSigma2, KAPPA) },
    loser: { ...loser, mu: newLoserMu, sigma2: Math.max(newLoserSigma2, KAPPA) },
  }
}

/**
 * Compute final rankings from a set of pairwise comparisons.
 */
export function computeRankings(
  itemIds: string[],
  comparisons: Array<{ winnerId: string; loserId: string }>
): Array<{ id: string; score: number; rank: number }> {
  const items = new Map<string, CrowdBTItem>(
    itemIds.map((id) => [id, initItem(id)])
  )

  for (const { winnerId, loserId } of comparisons) {
    const winner = items.get(winnerId)
    const loser = items.get(loserId)
    if (!winner || !loser) continue
    const updated = updateComparison(winner, loser)
    items.set(winnerId, updated.winner)
    items.set(loserId, updated.loser)
  }

  const sorted = Array.from(items.values())
    .sort((a, b) => b.mu - a.mu)
    .map((item, idx) => ({
      id: item.id,
      score: Math.round((item.mu + 5) * 10) / 10, // normalize roughly to 0-10
      rank: idx + 1,
    }))

  return sorted
}

// ─── Math helpers ─────────────────────────────────────────────────────────────

function gaussianPDF(x: number): number {
  return Math.exp(-0.5 * x * x) / Math.sqrt(2 * Math.PI)
}

function gaussianCDF(x: number): number {
  return 0.5 * (1 + erf(x / Math.sqrt(2)))
}

function erf(x: number): number {
  // Abramowitz & Stegun approximation
  const t = 1 / (1 + 0.3275911 * Math.abs(x))
  const poly =
    t * (0.254829592 + t * (-0.284496736 + t * (1.421413741 + t * (-1.453152027 + t * 1.061405429))))
  const result = 1 - poly * Math.exp(-x * x)
  return x >= 0 ? result : -result
}
