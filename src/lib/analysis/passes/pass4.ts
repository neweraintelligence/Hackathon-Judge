import Anthropic from '@anthropic-ai/sdk'
import { buildPass4Prompt } from '@/lib/analysis/prompts/pass4'
import { MODELS } from '@/lib/constants/models'
import type { Pass4Result } from '@/types'

export async function runPass4(screenshotUrls: string[]): Promise<Pass4Result> {
  if (screenshotUrls.length === 0) {
    return {
      visual_hierarchy_score: 0,
      design_consistency_score: 0,
      ux_flow_score: 0,
      brand_cohesion_score: 0,
      overall_visual_score: 0,
      screenshots_analyzed: 0,
      ux_commentary: ['No screenshots provided — visual analysis skipped.'],
    }
  }

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  const prompt = buildPass4Prompt(screenshotUrls.length)

  // Build image content blocks
  const imageBlocks: Anthropic.ImageBlockParam[] = await Promise.all(
    screenshotUrls.slice(0, 8).map(async (url) => {
      // Fetch image and convert to base64
      const res = await fetch(url)
      const arrayBuffer = await res.arrayBuffer()
      const base64 = Buffer.from(arrayBuffer).toString('base64')
      const contentType = (res.headers.get('content-type') || 'image/png') as
        | 'image/jpeg'
        | 'image/png'
        | 'image/gif'
        | 'image/webp'
      return {
        type: 'image' as const,
        source: { type: 'base64' as const, media_type: contentType, data: base64 },
      }
    })
  )

  const response = await client.messages.create({
    model: MODELS.SONNET,
    max_tokens: 2048,
    messages: [
      {
        role: 'user',
        content: [
          ...imageBlocks,
          { type: 'text', text: prompt },
        ],
      },
    ],
  })

  const text = response.content.find((b) => b.type === 'text')?.text || '{}'
  const result = JSON.parse(text) as Pass4Result
  result.screenshots_analyzed = screenshotUrls.length

  return result
}
