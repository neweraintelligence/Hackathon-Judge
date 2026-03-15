import Anthropic from '@anthropic-ai/sdk'
import { fetchRepoData } from '@/lib/github/repo-fetcher'
import { buildPass2Prompt } from '@/lib/analysis/prompts/pass2'
import { MODELS } from '@/lib/constants/models'
import type { Pass1Result, Pass2Result } from '@/types'

export async function runPass2(githubUrl: string, pass1: Pass1Result): Promise<Pass2Result> {
  const repoData = await fetchRepoData(githubUrl)
  const prompt = buildPass2Prompt(repoData, pass1)

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  const response = await client.messages.create({
    model: MODELS.SONNET,
    max_tokens: 4096,
    messages: [{ role: 'user', content: prompt }],
  })

  const textBlock = response.content.find((b: any) => b.type === 'text')
  const text = textBlock ? (textBlock as any).text : '{}'

  const result = JSON.parse(text) as Pass2Result
  result.thinking_summary = ''
  result.files_analyzed = repoData.key_source_files.map((f) => f.path)

  return result
}
