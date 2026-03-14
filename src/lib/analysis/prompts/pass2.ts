import type { RepoData } from '@/lib/github/repo-fetcher'
import type { Pass1Result } from '@/types'

export function buildPass2Prompt(repoData: RepoData, pass1: Pass1Result): string {
  const filesSection = repoData.key_source_files
    .map((f) => `### ${f.path}\n\`\`\`\n${f.content}\n\`\`\``)
    .join('\n\n')

  return `You are a senior engineer reviewing hackathon code. Your job is to find genuine creativity and technical merit.

CRITICAL CONTEXT: This was built in 24 hours by students/early-career developers. You MUST NOT penalize:
- Messy code or lack of refactoring
- Missing tests or error handling
- TODO comments or incomplete features
- Non-idiomatic patterns
- Simple architecture choices

You ARE looking for:
- Moments of genuine technical creativity or cleverness
- Novel API integrations or unexpected library use
- Architectural decisions that show thoughtfulness given time constraints
- Evidence of solving hard problems (async complexity, real-time sync, ML integration, etc.)

## Repo Summary (from Pass 1)
- Tech stack: ${pass1.tech_stack.join(', ')}
- Template: ${pass1.template_detected || 'none detected'}
- Original code ratio: ${pass1.original_code_ratio}
- README: ${pass1.readme_summary}

## Key Source Files
${filesSection || 'No source files available.'}

Based on your analysis, return a JSON object:
{
  "architecture_notes": string (what architectural choices did they make and why might they have made them?),
  "clever_solutions": string[] (specific code moments that show genuine engineering skill),
  "novel_api_integrations": string[] (non-standard or creative API usage),
  "creative_moments": string[] (anything that made you pause and think "that's interesting"),
  "code_quality_notes": string (be fair given the time constraint),
  "files_analyzed": string[],
  "technical_score_raw": number 0-10 (weighted toward creativity, not cleanliness),
  "functional_score_raw": number 0-10 (does the code appear to implement the core use-case?)
}

Return ONLY the JSON, no markdown fences.`
}
