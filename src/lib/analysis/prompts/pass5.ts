import type { Pass1Result, Pass2Result, Pass3Result } from '@/types'

interface PoolEntry {
  submissionId: string
  teamName: string
  pass1: Pass1Result
  pass2: Pass2Result
  pass3: Pass3Result
}

export function buildPass5Prompt(
  targetId: string,
  targetTeamName: string,
  poolEntries: PoolEntry[]
): string {
  const poolSummary = poolEntries
    .map(
      (e) => `## ${e.teamName} (id: ${e.submissionId})
- Tech: ${e.pass1.tech_stack.join(', ')}
- Innovation score: ${e.pass3.innovation_score}/10
- Surprise factor: ${e.pass3.senior_engineer_surprise_factor}
- Technical score: ${e.pass2.technical_score_raw}/10
- Functional score: ${e.pass2.functional_score_raw}/10
- Template: ${e.pass1.template_detected || 'none'}
- Common patterns: ${e.pass3.common_pattern_matches.join(', ') || 'none'}`
    )
    .join('\n\n')

  return `You are comparing a hackathon submission against the rest of the submission pool to provide relative rankings.

## Target Submission: ${targetTeamName} (id: ${targetId})

## Full Pool (${poolEntries.length} submissions):
${poolSummary}

## Task:
1. Where does ${targetTeamName} rank in this pool across key dimensions?
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
