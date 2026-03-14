export function buildPass4Prompt(screenshotCount: number): string {
  return `You are a UX and visual design expert reviewing a hackathon project. You have been provided with ${screenshotCount} screenshot(s) of the interface.

## What to evaluate (hackathon context — built in 24 hours):

1. **Visual Hierarchy**: Can you immediately tell what's important? Is there a clear primary action?
2. **Design Consistency**: Do colors, typography, spacing feel intentional and consistent?
3. **UX Flow Clarity**: Is it obvious how to use this? Would a stranger understand it?
4. **Brand Cohesion**: Does it have a distinct visual identity, even if minimal?

IMPORTANT: Do not penalize for simplicity. A clean minimal interface that works is better than an ambitious one that doesn't. Polish matters more than complexity.

For each screenshot provided, note what you observe. Then give overall scores.

Return a JSON object:
{
  "visual_hierarchy_score": number 0-10,
  "design_consistency_score": number 0-10,
  "ux_flow_score": number 0-10,
  "brand_cohesion_score": number 0-10,
  "overall_visual_score": number 0-10,
  "screenshots_analyzed": number,
  "ux_commentary": string[] (2-4 specific observations about the UI, positive or constructive)
}

Return ONLY the JSON, no markdown fences.`
}
