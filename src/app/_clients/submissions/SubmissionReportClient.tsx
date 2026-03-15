'use client'
import { useState } from 'react'
import Link from 'next/link'
import type { SubmissionWithAnalysis, Pass1Result, Pass6Result } from '@/types'
import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { ProgressRing } from '@/components/ui/ProgressRing'
import { CriteriaBreakdown } from '@/components/ui/CriteriaBreakdown'
import { AnalysisPipelineProgress } from './AnalysisPipelineProgress'
import { AIJudgePanelCard } from '@/app/_clients/judge/AIJudgePanelCard'
import { AriaStreamingAvatar } from '@/components/ui/AriaStreamingAvatar'
import { HeyGenAriaAvatar } from '@/components/ui/HeyGenAriaAvatar'
import { AvatarProviderPicker, type AvatarProvider } from '@/components/ui/AvatarProviderPicker'
import { DEFAULT_CRITERIA } from '@/lib/constants/criteria'

interface Props {
  submission: SubmissionWithAnalysis
}

export function SubmissionReportClient({ submission }: Props) {
  const pass1 = submission.ai_analyses.find((a) => a.pass_name === 'pass1_repo_archaeology')?.result as Pass1Result | null
  const pass6 = submission.ai_analyses.find((a) => a.pass_name === 'pass6_synthesis')?.result as Pass6Result | null
  const poolScore = submission.pool_scores?.[0]

  const techStack = pass1?.tech_stack || []
  const isReady = submission.status === 'ready'
  const isAnalyzing = submission.status === 'analyzing'

  // Separate AI judge scores from human judge scores
  const aiJudgeScores = (submission.judge_scores || []).filter((s) => s.judges?.is_ai_judge)
  const aiJudgeName = aiJudgeScores[0] ? (aiJudgeScores[0] as any).judges?.display_name || 'Aria' : 'Aria'
  const [showPicker, setShowPicker] = useState(false)
  const [avatarProvider, setAvatarProvider] = useState<AvatarProvider | null>(null)
  const canHearAria = aiJudgeScores.length > 0 && isReady

  return (
    <>
      {showPicker && (
        <AvatarProviderPicker
          onSelect={(p) => { setShowPicker(false); setAvatarProvider(p) }}
          onCancel={() => setShowPicker(false)}
        />
      )}
      {avatarProvider === 'did' && (
        <AriaStreamingAvatar
          submission={submission}
          judgeName={aiJudgeName}
          onClose={() => setAvatarProvider(null)}
        />
      )}
      {avatarProvider === 'heygen' && (
        <HeyGenAriaAvatar
          submission={submission}
          judgeName={aiJudgeName}
          onClose={() => setAvatarProvider(null)}
        />
      )}
    <div className="min-h-screen bg-[#0a0a0f]">
      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <div className="label">Submission Report</div>
            {canHearAria && (
              <button
                onClick={() => setShowPicker(true)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium bg-purple-600/20 hover:bg-purple-600/35 text-purple-300 hover:text-purple-200 border border-purple-500/30 transition-all"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-purple-400 animate-pulse" />
                Hear from Avatar Judge
              </button>
            )}
          </div>
          <div className="flex items-start gap-4">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-white mb-2">{submission.team_name}</h1>
              <div className="flex flex-wrap items-center gap-2">
                <a
                  href={submission.github_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-purple-400 hover:text-purple-300 font-mono"
                >
                  {submission.github_url.replace('https://github.com/', 'github/')}
                </a>
                {techStack.slice(0, 5).map((t) => (
                  <Badge key={t} variant="default">{t}</Badge>
                ))}
              </div>
            </div>
            {poolScore && (
              <div className="text-right shrink-0">
                <ProgressRing score={poolScore.overall_score} size={72} strokeWidth={5} />
                <div className="text-xs text-gray-500 mt-1">
                  #{poolScore.pool_rank} · {poolScore.percentile}th %ile
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Analysis progress (if not ready) */}
        {(isAnalyzing || !isReady) && (
          <Card className="mb-6">
            <div className="label mb-3">Analysis Pipeline</div>
            <AnalysisPipelineProgress
              submissionId={submission.id}
              initialAnalyses={submission.ai_analyses}
            />
          </Card>
        )}

        {/* Pass 6 synthesis */}
        {pass6 && (
          <>
            {/* Most impressive */}
            {pass6.most_impressive_aspect && (
              <Card glow className="mb-4">
                <div className="label text-purple-400 mb-2">Most Impressive</div>
                <p className="text-gray-200 leading-relaxed">{pass6.most_impressive_aspect}</p>
              </Card>
            )}

            {/* Criteria breakdown */}
            <Card className="mb-4">
              <div className="label mb-3">Criteria Scores</div>
              <CriteriaBreakdown
                scores={submission.ai_scores}
                criteria={DEFAULT_CRITERIA}
              />
            </Card>

            {/* Concerns */}
            {pass6.concerns_and_limitations?.length > 0 && (
              <Card className="mb-4">
                <div className="label mb-2">Concerns & Limitations</div>
                <ul className="space-y-1">
                  {pass6.concerns_and_limitations.map((c, i) => (
                    <li key={i} className="text-sm text-gray-400 flex items-start gap-2">
                      <span className="text-red-400 shrink-0 mt-0.5">·</span>
                      {c}
                    </li>
                  ))}
                </ul>
              </Card>
            )}

            {/* Judge briefing */}
            {pass6.judge_briefing_points?.length > 0 && (
              <Card className="mb-4">
                <div className="label mb-2">Judge Briefing</div>
                <ul className="space-y-2">
                  {pass6.judge_briefing_points.map((p, i) => (
                    <li key={i} className="text-sm text-gray-300 flex items-start gap-2">
                      <span className="text-purple-400 font-bold shrink-0">{i + 1}.</span>
                      {p}
                    </li>
                  ))}
                </ul>
              </Card>
            )}

            {/* Award categories */}
            {pass6.recommended_award_categories?.length > 0 && (
              <Card>
                <div className="label mb-2">Recommended Award Categories</div>
                <div className="flex flex-wrap gap-2">
                  {pass6.recommended_award_categories.map((cat) => (
                    <Badge key={cat} variant="purple">🏆 {cat}</Badge>
                  ))}
                </div>
              </Card>
            )}

            {/* AI Judge Panel Card */}
            {aiJudgeScores.length > 0 && (
              <AIJudgePanelCard
                name={aiJudgeName}
                scores={aiJudgeScores}
                criteria={DEFAULT_CRITERIA}
              />
            )}
          </>
        )}

        {/* Repo stats from pass 1 */}
        {pass1 && (
          <Card className="mt-4">
            <div className="label mb-3">Repo Stats</div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: 'Files', value: pass1.file_count },
                { label: 'Commits (window)', value: pass1.commit_count_in_window },
                { label: 'Original Code', value: `${Math.round(pass1.original_code_ratio * 100)}%` },
                { label: 'Template', value: pass1.template_detected || 'None detected' },
              ].map(({ label, value }) => (
                <div key={label}>
                  <div className="label mb-1">{label}</div>
                  <div className="text-white font-medium text-sm">{value}</div>
                </div>
              ))}
            </div>
            {pass1.readme_summary && (
              <div className="mt-4">
                <div className="label mb-1">README Summary</div>
                <p className="text-gray-400 text-sm">{pass1.readme_summary}</p>
              </div>
            )}
          </Card>
        )}

        {/* Screenshots */}
        {submission.submission_media?.filter((m) => m.type === 'screenshot').length > 0 && (
          <Card className="mt-4">
            <div className="label mb-3">Screenshots</div>
            <div className="grid grid-cols-2 gap-3">
              {submission.submission_media
                .filter((m) => m.type === 'screenshot')
                .sort((a, b) => a.sort_order - b.sort_order)
                .map((m) => (
                  <img
                    key={m.id}
                    src={m.storage_url}
                    alt="Screenshot"
                    className="rounded-lg border border-white/10 w-full object-cover"
                  />
                ))}
            </div>
          </Card>
        )}
      </div>
    </div>
    </>
  )
}
