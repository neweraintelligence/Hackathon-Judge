import Anthropic from '@anthropic-ai/sdk'
import { fetchRepoData } from '@/lib/github/repo-fetcher'
import { buildPass1Prompt } from '@/lib/analysis/prompts/pass1'
import { MODELS } from '@/lib/constants/models'
import type { Pass1Result } from '@/types'

export async function runPass1(githubUrl: string): Promise<Pass1Result> {
  const repoData = await fetchRepoData(githubUrl)
  const prompt = buildPass1Prompt(repoData)

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  const response = await client.messages.create({
    model: MODELS.SONNET,
    max_tokens: 2048,
    messages: [{ role: 'user', content: prompt }],
  })

  const text = response.content.find((b) => b.type === 'text')?.text || '{}'
  const result = JSON.parse(text) as Pass1Result

  // Merge in actual repo data for fields we have ground truth on
  result.github_url = githubUrl
  result.is_forked = repoData.is_forked
  result.file_count = repoData.file_count
  result.languages = repoData.languages
  result.commit_count_in_window = repoData.commit_count_in_window
  result.commit_authors = repoData.commit_authors
  result.template_detected = repoData.template_detected
  result.template_confidence = repoData.template_confidence
  result.original_code_ratio = repoData.original_code_ratio

  return result
}
