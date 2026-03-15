import Anthropic from '@anthropic-ai/sdk'
import { buildPass3Prompt } from '@/lib/analysis/prompts/pass3'
import { MODELS } from '@/lib/constants/models'
import type { Pass1Result, Pass2Result, Pass3Result } from '@/types'

export async function runPass3(pass1: Pass1Result, pass2: Pass2Result): Promise<Pass3Result> {
  const prompt = buildPass3Prompt(pass1, pass2)

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  const response = await client.messages.create({
    model: MODELS.SONNET,
    max_tokens: 4096,
    messages: [{ role: 'user', content: prompt }],
  })

  const textBlock = response.content.find((b: any) => b.type === 'text')
  const text = textBlock ? (textBlock as any).text : '{}'

  const result = JSON.parse(text) as Pass3Result
  result.thinking_summary = ''

  return result
}
