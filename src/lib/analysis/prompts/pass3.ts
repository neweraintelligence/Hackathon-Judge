import type { Pass1Result, Pass2Result } from '@/types'

const COMMON_HACKATHON_PATTERNS = [
  'LangChain + Pinecone vector search CRUD app',
  'Standard REST API with CRUD operations on a simple data model',
  'Todo/task management app',
  'Weather app using public weather API',
  'News aggregator using RSS or News API',
  'Basic chatbot using OpenAI API with no custom logic',
  'Portfolio website',
  'Recipe finder/calorie tracker',
  'Stock price tracker',
  'Twitter/social media feed clone',
  'Simple quiz app',
  'Boilerplate e-commerce with Stripe',
]

export function buildPass3Prompt(pass1: Pass1Result, pass2: Pass2Result): string {
  return `You are evaluating a hackathon project for innovation and originality. You have seen hundreds of hackathon projects.

Your job: be honest about whether this is a genuinely novel project or a variation on common patterns.

## Common hackathon pattern categories to check against:
${COMMON_HACKATHON_PATTERNS.map((p, i) => `${i + 1}. ${p}`).join('\n')}

## Project Information

**Tech stack**: ${pass1.tech_stack.join(', ')}
**README summary**: ${pass1.readme_summary}
**Template detected**: ${pass1.template_detected || 'none'}
**Architecture**: ${pass2.architecture_notes}
**Clever solutions found**: ${pass2.clever_solutions.join('; ') || 'none noted'}
**Novel APIs**: ${pass2.novel_api_integrations.join('; ') || 'none'}
**Creative moments**: ${pass2.creative_moments.join('; ') || 'none'}

## Questions to answer with extended thinking:
1. Which common patterns (if any) does this match? Be specific.
2. What makes this different from those patterns? Or does it just execute them?
3. Would a senior engineer find this surprising or predictable?
4. Does the PROBLEM SPACE itself have novelty, or is it a familiar problem?
5. Is there a combination of ideas here that feels genuinely original?

**Innovation score anchors — use the full range:**
- 9-10: Genuinely rare combination or insight; a senior engineer would stop and say "I haven't seen that before"
- 7-8: Solid creative angle, non-obvious tech combination, or real domain insight — above average but not exceptional
- 5-6: Familiar problem with some differentiation, or a common pattern executed cleanly
- 3-4: Standard API integration or well-worn pattern with minimal twist
- 1-2: Direct clone or near-zero original concept

Return a JSON object:
{
  "innovation_score": number 0-10,
  "senior_engineer_surprise_factor": "meh" | "interesting" | "impressive" | "exceptional",
  "common_pattern_matches": string[] (which patterns from the list does this match?),
  "differentiating_factors": string[] (what genuinely sets this apart, if anything),
  "problem_novelty_notes": string (is the problem space itself novel?)
}

Return ONLY the JSON, no markdown fences.`
}
