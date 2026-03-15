import Anthropic from '@anthropic-ai/sdk'
import { fetchRepoData } from '@/lib/github/repo-fetcher'
import { buildPass2Prompt } from '@/lib/analysis/prompts/pass2'
import { MODELS, THINKING_BUDGETS } from '@/lib/constants/models'
import type { Pass1Result, Pass2Result } from '@/types'

export async function runPass2(githubUrl: string, pass1: Pass1Result): Promise<Pass2Result> {
  const repoData = await fetchRepoData(githubUrl)
  const prompt = buildPass2Prompt(repoData, pass1)

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  let thinkingSummary = ''
  let text = '{}'

  const stream = await client.messages.stream({
    model: MODELS.OPUS,
    max_tokens: THINKING_BUDGETS.PASS2 + 4096,
    thinking: { type: 'enabled', budget_tokens: THINKING_BUDGETS.PASS2 },
    messages: [{ role: 'user', content: prompt }],
  } as any)

  const response = await stream.finalMessage()

  const thinkingBlock = response.content.find((b: any) => b.type === 'thinking')
  thinkingSummary = thinkingBlock ? (thinkingBlock as any).thinking?.slice(0, 500) || '' : ''

  const textBlock = response.content.find((b: any) => b.type === 'text')
  text = textBlock ? (textBlock as any).text : '{}'

  const result = JSON.parse(text) as Pass2Result
  result.thinking_summary = thinkingSummary
  result.files_analyzed = repoData.key_source_files.map((f) => f.path)

  return result
}
