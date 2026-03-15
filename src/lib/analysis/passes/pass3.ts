import Anthropic from '@anthropic-ai/sdk'
import { buildPass3Prompt } from '@/lib/analysis/prompts/pass3'
import { MODELS, THINKING_BUDGETS } from '@/lib/constants/models'
import type { Pass1Result, Pass2Result, Pass3Result } from '@/types'

export async function runPass3(pass1: Pass1Result, pass2: Pass2Result): Promise<Pass3Result> {
  const prompt = buildPass3Prompt(pass1, pass2)

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  const stream = await client.messages.stream({
    model: MODELS.OPUS,
    max_tokens: THINKING_BUDGETS.PASS3 + 4096,
    thinking: { type: 'enabled', budget_tokens: THINKING_BUDGETS.PASS3 },
    messages: [{ role: 'user', content: prompt }],
  } as any)

  const response = await stream.finalMessage()

  const thinkingBlock = response.content.find((b: any) => b.type === 'thinking')
  const thinkingSummary = thinkingBlock
    ? (thinkingBlock as any).thinking?.slice(0, 500) || ''
    : ''

  const textBlock = response.content.find((b: any) => b.type === 'text')
  const text = textBlock ? (textBlock as any).text : '{}'

  const result = JSON.parse(text) as Pass3Result
  result.thinking_summary = thinkingSummary

  return result
}
