'use client'
import { useState } from 'react'
import Link from 'next/link'
import type { Event, SubmissionWithAnalysis } from '@/types'
import { AIReportPanel } from './AIReportPanel'
import { RubricPanel } from './RubricPanel'
import { PillTabs } from '@/components/ui/PillTabs'

interface Props {
  event: Event
  submission: SubmissionWithAnalysis
  judgeId?: string
}

export function JudgeScoringClient({ event, submission, judgeId }: Props) {
  const [panel, setPanel] = useState<'ai' | 'rubric'>('ai')

  const tabs = [
    { key: 'ai', label: 'AI Report' },
    { key: 'rubric', label: 'Score' },
  ]

  return (
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
          <PillTabs tabs={tabs} activeTab={panel} onTabChange={(k) => setPanel(k as any)} />
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
  )
}
