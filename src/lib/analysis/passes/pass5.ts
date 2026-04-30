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

const MAX_ATTEMPTS = 3

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function isRetryableAnthropicError(error: unknown): boolean {
  const status = typeof error === 'object' && error !== null && 'status' in error
    ? Number((error as { status?: number }).status)
    : 0
  const message = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase()

  return status === 429 || status === 500 || status === 529 || status === 503 ||
    message.includes('rate') || message.includes('overloaded')
}

function extractJsonObject(text: string): string {
  const trimmed = text.trim()
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i)
  if (fenced) return fenced[1].trim()

  const start = trimmed.indexOf('{')
  const end = trimmed.lastIndexOf('}')
  if (start >= 0 && end > start) return trimmed.slice(start, end + 1)

  return trimmed
}

function fallbackPass5(poolSize: number, reason: string): Pass5Result {
  return {
    pool_rank: Math.max(1, Math.ceil((poolSize + 1) / 2)),
    pool_size: poolSize,
    percentile: poolSize > 0 ? 50 : 100,
    relative_standing: `Pool comparison was skipped because ${reason}. Review the repo and synthesis passes for final judging context.`,
    outperforms_pool_on: [],
    underperforms_pool_on: [],
    comparable_submissions: [],
  }
}

export async function runPass5(
  target: PoolEntry,
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

  const prompt = buildPass5Prompt(target, pool)
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const response = await client.messages.create({
        model: MODELS.SONNET,
        max_tokens: 2048,
        messages: [{ role: 'user', content: prompt }],
      })

      const text = response.content.find((b) => b.type === 'text')?.text || '{}'
      return JSON.parse(extractJsonObject(text)) as Pass5Result
    } catch (error) {
      if (attempt < MAX_ATTEMPTS && isRetryableAnthropicError(error)) {
        await sleep(1000 * attempt * attempt)
        continue
      }

      console.error(`[pipeline] ${target.submissionId} pass5 comparison failed:`, error)
      return fallbackPass5(pool.length, error instanceof Error ? error.message : 'the AI comparison service failed')
    }
  }

  return fallbackPass5(pool.length, 'the AI comparison service did not return a result')
}
