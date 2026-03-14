import type {
  Pass1Result,
  Pass2Result,
  Pass3Result,
  Pass4Result,
  Pass5Result,
  CriterionConfig,
} from '@/types'

export function buildPass6Prompt(
  teamName: string,
  criteria: CriterionConfig[],
  pass1: Pass1Result,
  pass2: Pass2Result,
  pass3: Pass3Result,
  pass4: Pass4Result | null,
  pass5: Pass5Result | null
): string {
  const criteriaList = criteria
    .map(
      (c) => `- **${c.label}** (key: "${c.key}", weight: ${c.weight * 100}%): ${c.description}
  Sub-questions: ${c.subQuestions.map((q, i) => `\n    ${i + 1}. ${q}`).join('')}`
    )
    .join('\n')

  return `You are synthesizing all analysis passes for a hackathon submission and producing the final structured judging report.

## Team: ${teamName}

## Evidence from previous passes:

### Pass 1 — Repo Facts
- Tech stack: ${pass1.tech_stack.join(', ')}
- Template: ${pass1.template_detected || 'none'} (confidence: ${pass1.template_confidence})
- Original code ratio: ${pass1.original_code_ratio}
- Commits in window: ${pass1.commit_count_in_window}
- README: ${pass1.readme_summary}

### Pass 2 — Code Analysis
- Architecture: ${pass2.architecture_notes}
- Clever solutions: ${pass2.clever_solutions.join('; ') || 'none'}
- Novel APIs: ${pass2.novel_api_integrations.join('; ') || 'none'}
- Creative moments: ${pass2.creative_moments.join('; ') || 'none'}
- Technical score: ${pass2.technical_score_raw}/10
- Functional score: ${pass2.functional_score_raw}/10

### Pass 3 — Innovation Audit
- Innovation score: ${pass3.innovation_score}/10
- Surprise factor: ${pass3.senior_engineer_surprise_factor}
- Common patterns matched: ${pass3.common_pattern_matches.join(', ') || 'none'}
- Differentiators: ${pass3.differentiating_factors.join('; ') || 'none'}

### Pass 4 — Visual/UX
${pass4 ? `- Visual hierarchy: ${pass4.visual_hierarchy_score}/10
- Design consistency: ${pass4.design_consistency_score}/10
- UX flow: ${pass4.ux_flow_score}/10
- Overall visual: ${pass4.overall_visual_score}/10
- Commentary: ${pass4.ux_commentary.join('; ')}` : 'Not available (no screenshots provided)'}

### Pass 5 — Pool Comparison
${pass5 ? `- Pool rank: #${pass5.pool_rank} of ${pass5.pool_size}
- Percentile: ${pass5.percentile}th
- Standing: ${pass5.relative_standing}
- Outperforms on: ${pass5.outperforms_pool_on.join(', ')}
- Underperforms on: ${pass5.underperforms_pool_on.join(', ')}` : 'Not yet available (pool too small)'}

## Judging Criteria:
${criteriaList}

## Your synthesis task:
Using ALL the evidence above, produce a comprehensive final judging report. For each criterion, give a score (0-10) WITH 3-5 sentences of reasoning that references specific evidence from the passes above. Be honest and calibrated — a 7 should be genuinely good, a 5 is average.

Return a JSON object:
{
  "criteria_scores": [
    {
      "criteria_key": string,
      "score": number 0-10,
      "reasoning": string (3-5 sentences citing specific evidence),
      "confidence": "low" | "medium" | "high"
    }
  ],
  "overall_score": number 0-10 (weighted composite),
  "most_impressive_aspect": string (1-2 sentences on the single most impressive thing),
  "concerns_and_limitations": string[] (2-4 honest concerns),
  "judge_briefing_points": string[] (3-5 bullet points for human judges to discuss),
  "recommended_award_categories": string[] (from: "Best Use of AI", "Most Creative", "Best Design", "Best Technical", "Most Impactful", "Best First Hackathon")
}

Return ONLY the JSON, no markdown fences.`
}
