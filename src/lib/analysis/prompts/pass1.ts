import type { RepoData } from '@/lib/github/repo-fetcher'

export function buildPass1Prompt(repoData: RepoData): string {
  return `You are analyzing a hackathon submission repository. Extract structured facts about the codebase.

## Repository Data

**File count**: ${repoData.file_count}
**Languages**: ${JSON.stringify(repoData.languages)}
**Is forked**: ${repoData.is_forked}
**Commits in hackathon window**: ${repoData.commit_count_in_window}
**Commit authors**: ${repoData.commit_authors.join(', ')}
**Template detected**: ${repoData.template_detected || 'none'} (confidence: ${repoData.template_confidence})
**Original code ratio**: ${repoData.original_code_ratio}

## File Tree (partial)
\`\`\`
${repoData.file_tree.slice(0, 100).join('\n')}
\`\`\`

## README
${repoData.readme_content || 'No README found.'}

Based on this data, produce a JSON object with these exact fields:
{
  "github_url": string,
  "is_forked": boolean,
  "file_count": number,
  "languages": Record<string, number>,
  "tech_stack": string[],
  "template_detected": string | null,
  "template_confidence": number,
  "original_code_ratio": number,
  "commit_count_in_window": number,
  "commit_authors": string[],
  "readme_summary": string (2-3 sentences summarizing what the README says),
  "key_files": string[] (up to 10 most significant non-boilerplate files)
}

Return ONLY the JSON, no markdown fences.`
}
