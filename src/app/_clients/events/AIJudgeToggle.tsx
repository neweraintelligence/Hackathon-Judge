'use client'
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { AIJudgeAvatar } from '@/components/ui/AIJudgeAvatar'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { DEFAULT_PERSONA } from '@/lib/ai-judge/persona'
import { enableAIJudge, disableAIJudge } from '@/lib/actions/ai-judge'

interface Props {
  eventId: string
  eventSlug: string
  enabled: boolean
  judgeCount: number
  name: string
}

export function AIJudgeToggle({ eventId, eventSlug, enabled, judgeCount, name }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [showInfo, setShowInfo] = useState(false)
  const [customName, setCustomName] = useState(name)

  function handleEnable() {
    startTransition(async () => {
      await enableAIJudge(eventId, eventSlug, customName)
      router.refresh()
    })
  }

  function handleDisable() {
    startTransition(async () => {
      await disableAIJudge(eventId, eventSlug)
      router.refresh()
    })
  }

  return (
    <div className={`rounded-2xl border transition-all duration-300 overflow-hidden ${
      enabled
        ? 'bg-purple-600/5 border-purple-500/30 shadow-glow'
        : 'glass border-white/[0.06]'
    }`}>
      <div className="flex items-center gap-4 px-5 py-4">
        <AIJudgeAvatar size={48} pulse={enabled} />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="font-bold text-white">{customName}</span>
            {enabled ? (
              <Badge variant="purple">Active on panel</Badge>
            ) : (
              <Badge variant="default">Off</Badge>
            )}
          </div>
          <div className="text-xs text-gray-500">
            {enabled
              ? `Voting alongside ${judgeCount} human judge${judgeCount !== 1 ? 's' : ''}. ${customName}'s scores are weighted equally in the panel average.`
              : 'Add an AI judge to the panel who votes alongside your human judges.'}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setShowInfo((v) => !v)}
            className="text-gray-500 hover:text-gray-300 text-xs transition-colors"
          >
            {showInfo ? 'Less' : 'Info'}
          </button>
          {enabled ? (
            <Button
              variant="danger"
              size="sm"
              loading={isPending}
              onClick={handleDisable}
            >
              Remove
            </Button>
          ) : (
            <Button
              size="sm"
              loading={isPending}
              onClick={handleEnable}
            >
              Add to Panel
            </Button>
          )}
        </div>
      </div>

      {/* Expandable info panel */}
      {showInfo && (
        <div className="px-5 pb-4 border-t border-white/[0.04] pt-4 space-y-3">
          <div className="text-xs text-gray-400 leading-relaxed">
            {DEFAULT_PERSONA.bio}
          </div>

          {!enabled && (
            <div className="space-y-1">
              <label className="label">Judge Name</label>
              <div className="flex gap-2">
                <input
                  className="input text-sm"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder="Avatar Judge"
                />
              </div>
            </div>
          )}

          <div className="grid grid-cols-3 gap-3">
            {[
              { icon: '🧠', label: 'Extended Thinking', desc: 'Uses claude-opus-4-6 with 16k thinking budget' },
              { icon: '🎙️', label: 'First-Person Voice', desc: `Comments rewritten in ${customName}'s own voice per submission` },
              { icon: '⚖️', label: 'Equal Vote', desc: 'Scores count in the panel average, same weight as humans' },
            ].map((f) => (
              <div key={f.label} className="bg-white/[0.02] rounded-lg p-3">
                <div className="text-base mb-1">{f.icon}</div>
                <div className="text-[11px] font-medium text-gray-300 mb-0.5">{f.label}</div>
                <div className="text-[10px] text-gray-500 leading-relaxed">{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
