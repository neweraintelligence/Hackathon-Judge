import Anthropic from '@anthropic-ai/sdk'
import { buildPass6Prompt } from '@/lib/analysis/prompts/pass6'
import { MODELS, THINKING_BUDGETS } from '@/lib/constants/models'
import type {
  Pass1Result,
  Pass2Result,
  Pass3Result,
  Pass4Result,
  Pass5Result,
  Pass6Result,
  CriterionConfig,
} from '@/types'

export async function runPass6(
  teamName: string,
  criteria: CriterionConfig[],
  pass1: Pass1Result,
  pass2: Pass2Result,
  pass3: Pass3Result,
  pass4: Pass4Result | null,
  pass5: Pass5Result | null
): Promise<Pass6Result> {
  const prompt = buildPass6Prompt(teamName, criteria, pass1, pass2, pass3, pass4, pass5)

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  const response = await client.messages.create({
    model: MODELS.OPUS,
    max_tokens: THINKING_BUDGETS.PASS6 + 8192,
    thinking: { type: 'enabled', budget_tokens: THINKING_BUDGETS.PASS6 },
    messages: [{ role: 'user', content: prompt }],
    betas: ['interleaved-thinking-2025-05-14'],
  } as any)

  const thinkingBlock = response.content.find((b: any) => b.type === 'thinking')
  const thinkingSummary = thinkingBlock
    ? (thinkingBlock as any).thinking?.slice(0, 1000) || ''
    : ''

  const textBlock = response.content.find((b: any) => b.type === 'text')
  const text = textBlock ? (textBlock as any).text : '{}'

  const result = JSON.parse(text) as Pass6Result
  result.thinking_summary = thinkingSummary

  // Compute weighted overall score if not provided or wrong
  if (result.criteria_scores?.length > 0) {
    const weighted = result.criteria_scores.reduce((sum, cs) => {
      const criterion = criteria.find((c) => c.key === cs.criteria_key)
      const weight = criterion?.weight || 1 / criteria.length
      return sum + cs.score * weight
    }, 0)
    result.overall_score = Math.round(weighted * 10) / 10
  }

  return result
}
