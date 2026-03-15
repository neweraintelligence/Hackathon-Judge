'use client'
import { useState } from 'react'
import Link from 'next/link'
import type { Event, SubmissionWithAnalysis } from '@/types'
import { AIReportPanel } from './AIReportPanel'
import { RubricPanel } from './RubricPanel'
import { PillTabs } from '@/components/ui/PillTabs'
import { AriaStreamingAvatar } from '@/components/ui/AriaStreamingAvatar'
import { HeyGenAriaAvatar } from '@/components/ui/HeyGenAriaAvatar'
import { AvatarProviderPicker, type AvatarProvider } from '@/components/ui/AvatarProviderPicker'

interface Props {
  event: Event
  submission: SubmissionWithAnalysis
  judgeId?: string
}

export function JudgeScoringClient({ event, submission, judgeId }: Props) {
  const [panel, setPanel] = useState<'ai' | 'rubric'>('ai')
  const [showPicker, setShowPicker] = useState(false)
  const [avatarProvider, setAvatarProvider] = useState<AvatarProvider | null>(null)

  const analysisReady = submission.ai_analyses.some(
    (a) => a.pass_name === 'pass6_synthesis' && a.status === 'complete'
  )

  const tabs = [
    { key: 'ai', label: 'AI Report' },
    { key: 'rubric', label: 'Score' },
  ]

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
          judgeName={event.ai_judge_name || 'Aria'}
          onClose={() => setAvatarProvider(null)}
        />
      )}
      {avatarProvider === 'heygen' && (
        <HeyGenAriaAvatar
          submission={submission}
          judgeName={event.ai_judge_name || 'Aria'}
          onClose={() => setAvatarProvider(null)}
        />
      )}

      <div className="relative flex flex-col h-screen">
        <div className="shrink-0 border-b border-white/10 bg-[#0f1012]/92 backdrop-blur-lg">
          <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
            <div className="min-w-0">
              <div className="flex items-center gap-3 text-sm">
                <Link
                  href={`/events/${event.slug}/judge`}
                  className="text-gray-400 hover:text-gray-200 transition-colors"
                >
                  Back to Queue
                </Link>
                <div className="h-4 w-px bg-white/15" />
                <span className="text-gray-500">{event.name}</span>
              </div>
              <div className="mt-1.5 font-semibold text-white tracking-tight truncate">{submission.team_name}</div>
            </div>

            <div className="flex items-center gap-3">
              {event.ai_judge_enabled && analysisReady && (
                <button
                  onClick={() => setShowPicker(true)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium bg-purple-600/20 hover:bg-purple-600/35 text-purple-300 hover:text-purple-200 border border-purple-500/30 transition-all"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-purple-400 animate-pulse" />
                  Hear from {event.ai_judge_name || 'Aria'}
                </button>
              )}
              <PillTabs tabs={tabs} activeTab={panel} onTabChange={(k) => setPanel(k as any)} />
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-hidden">
          <div className="max-w-5xl mx-auto px-6 py-8 h-full overflow-y-auto">
            {panel === 'ai' && <AIReportPanel submission={submission} />}
            {panel === 'rubric' && (
              <RubricPanel event={event} submission={submission} judgeId={judgeId} />
            )}
          </div>
        </div>
      </div>
    </>
  )
}
