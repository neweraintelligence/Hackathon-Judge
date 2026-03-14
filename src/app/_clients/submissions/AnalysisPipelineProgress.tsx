'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { AIAnalysis, PassName } from '@/types'

const PASS_ORDER: PassName[] = [
  'pass1_repo_archaeology',
  'pass2_code_deep_dive',
  'pass3_innovation_audit',
  'pass4_visual_ux',
  'pass5_pool_comparison',
  'pass6_synthesis',
]

const PASS_LABELS: Record<PassName, string> = {
  pass1_repo_archaeology: 'Repo Archaeology',
  pass2_code_deep_dive: 'Code Deep Dive',
  pass3_innovation_audit: 'Innovation Audit',
  pass4_visual_ux: 'Visual Analysis',
  pass5_pool_comparison: 'Pool Comparison',
  pass6_synthesis: 'Synthesis',
}

interface Props {
  submissionId: string
  initialAnalyses: AIAnalysis[]
}

export function AnalysisPipelineProgress({ submissionId, initialAnalyses }: Props) {
  const [analyses, setAnalyses] = useState<AIAnalysis[]>(initialAnalyses)

  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel(`analyses:${submissionId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'ai_analyses',
          filter: `submission_id=eq.${submissionId}`,
        },
        (payload) => {
          setAnalyses((prev) => {
            const idx = prev.findIndex((a) => a.id === (payload.new as AIAnalysis).id)
            if (idx >= 0) {
              const updated = [...prev]
              updated[idx] = payload.new as AIAnalysis
              return updated
            }
            return [...prev, payload.new as AIAnalysis]
          })
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [submissionId])

  const byPass = new Map(analyses.map((a) => [a.pass_name, a]))

  return (
    <div className="space-y-2">
      {PASS_ORDER.map((passName, i) => {
        const analysis = byPass.get(passName)
        const status = analysis?.status || 'pending'

        return (
          <div key={passName} className="flex items-center gap-3">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs shrink-0 ${
              status === 'complete' ? 'bg-green-500/20 text-green-400' :
              status === 'running' ? 'bg-yellow-500/20 text-yellow-400 animate-pulse' :
              status === 'error' ? 'bg-red-500/20 text-red-400' :
              'bg-white/5 text-gray-600'
            }`}>
              {status === 'complete' ? '✓' :
               status === 'running' ? '…' :
               status === 'error' ? '✗' :
               (i + 1).toString()}
            </div>
            <div className={`text-sm ${
              status === 'complete' ? 'text-gray-300' :
              status === 'running' ? 'text-yellow-400' :
              status === 'error' ? 'text-red-400' :
              'text-gray-600'
            }`}>
              {PASS_LABELS[passName]}
            </div>
            {analysis?.model_used && status === 'complete' && (
              <span className="text-[10px] text-gray-600 font-mono">{analysis.model_used.replace('claude-', '')}</span>
            )}
          </div>
        )
      })}
    </div>
  )
}
