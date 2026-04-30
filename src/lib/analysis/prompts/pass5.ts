import type { Pass1Result, Pass2Result, Pass3Result } from '@/types'

interface PoolEntry {
  submissionId: string
  teamName: string
  pass1: Pass1Result
  pass2: Pass2Result
  pass3: Pass3Result
}

function list(values: unknown): string {
  return Array.isArray(values) && values.length > 0 ? values.join(', ') : 'none'
}

export function buildPass5Prompt(
  target: PoolEntry,
  poolEntries: PoolEntry[]
): string {
  const describe = (e: PoolEntry) => `## ${e.teamName} (id: ${e.submissionId})
- Tech: ${list(e.pass1.tech_stack)}
- Innovation score: ${e.pass3.innovation_score}/10
- Surprise factor: ${e.pass3.senior_engineer_surprise_factor}
- Technical score: ${e.pass2.technical_score_raw}/10
- Functional score: ${e.pass2.functional_score_raw}/10
- Template: ${e.pass1.template_detected || 'none'}
- Common patterns: ${list(e.pass3.common_pattern_matches)}`

  const poolSummary = poolEntries
    .map(describe)
    .join('\n\n')

  return `You are comparing a hackathon submission against the rest of the submission pool to provide relative rankings.

## Target Submission:
${describe(target)}

## Comparison Pool (${poolEntries.length} other submissions):
${poolSummary}

## Task:
1. Where does ${target.teamName} rank in this pool across key dimensions?
2. What does it outperform the pool on?
3. What does it underperform the pool on?
4. What is its approximate percentile?

Return a JSON object:
{
  "pool_rank": number (1 = best),
  "pool_size": ${poolEntries.length},
  "percentile": number 0-100 (100 = top of pool),
  "relative_standing": string (1-2 sentence summary of where this sits in the pool),
  "outperforms_pool_on": string[],
  "underperforms_pool_on": string[],
  "comparable_submissions": string[] (team names of the most similar projects)
}

Return ONLY the JSON, no markdown fences.`
}
