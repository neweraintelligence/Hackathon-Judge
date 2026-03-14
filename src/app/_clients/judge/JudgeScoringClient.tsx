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
    <div className="flex flex-col h-screen">
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06] shrink-0">
        <div className="flex items-center gap-3">
          <Link
            href={`/events/${event.slug}/judge`}
            className="text-gray-500 hover:text-gray-300 text-sm transition-colors"
          >
            ← Queue
          </Link>
          <div className="h-4 w-px bg-white/10" />
          <span className="font-medium text-white">{submission.team_name}</span>
        </div>
        <PillTabs tabs={tabs} activeTab={panel} onTabChange={(k) => setPanel(k as any)} />
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        <div className="max-w-3xl mx-auto px-6 py-8 h-full overflow-y-auto">
          {panel === 'ai' && <AIReportPanel submission={submission} />}
          {panel === 'rubric' && (
            <RubricPanel event={event} submission={submission} judgeId={judgeId} />
          )}
        </div>
      </div>
    </div>
  )
}
