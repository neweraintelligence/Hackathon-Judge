import Anthropic from '@anthropic-ai/sdk'
import { buildPass5Prompt } from '@/lib/analysis/prompts/pass5'
import { MODELS } from '@/lib/constants/models'
import type { Pass1Result, Pass2Result, Pass3Result, Pass5Result } from '@/types'

interface PoolEntry {
  submissionId: string
  teamName: string
  pass1: Pass1Result
  pass2: Pass2Result
  pass3: Pass3Result
}

export async function runPass5(
  targetId: string,
  targetTeamName: string,
  pool: PoolEntry[]
): Promise<Pass5Result> {
  if (pool.length < 3) {
    return {
      pool_rank: 1,
      pool_size: pool.length,
      percentile: 100,
      relative_standing: 'Pool too small for meaningful comparison.',
      outperforms_pool_on: [],
      underperforms_pool_on: [],
      comparable_submissions: [],
    }
  }

  const prompt = buildPass5Prompt(targetId, targetTeamName, pool)
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  const response = await client.messages.create({
    model: MODELS.SONNET,
    max_tokens: 2048,
    messages: [{ role: 'user', content: prompt }],
  })

  const text = response.content.find((b) => b.type === 'text')?.text || '{}'
  return JSON.parse(text) as Pass5Result
}
