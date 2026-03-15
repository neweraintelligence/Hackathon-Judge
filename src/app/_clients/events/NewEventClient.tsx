'use client'
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createEvent } from '@/lib/actions/events'
import { DEFAULT_CRITERIA } from '@/lib/constants/criteria'
import { Button } from '@/components/ui/Button'
import type { CriterionConfig } from '@/types'

export function NewEventClient() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [criteria, setCriteria] = useState<CriterionConfig[]>(DEFAULT_CRITERIA)

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    formData.set('criteria_config', JSON.stringify(criteria))
    setError(null)
    startTransition(async () => {
      const res = await createEvent(formData)
      if (res.error) {
        setError(res.error)
      } else {
        router.push(`/events/${res.slug}`)
      }
    })
  }

  const totalWeight = criteria.reduce((s, c) => s + c.weight, 0)

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      <div className="max-w-2xl mx-auto px-6 py-12">
        <Link href="/events" className="text-sm text-gray-500 hover:text-gray-300 transition-colors mb-6 inline-block">
          ← Events
        </Link>
        <h1 className="text-3xl font-bold text-white mb-8">New Event</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="card space-y-4">
            <h2 className="font-semibold text-white">Event Details</h2>

            <div className="space-y-1">
              <label className="label" htmlFor="name">Event Name</label>
              <input id="name" name="name" className="input" placeholder="e.g. Hackathon 2025" required />
            </div>

            <div className="space-y-1">
              <label className="label" htmlFor="date">Date</label>
              <input id="date" name="date" type="date" className="input" required />
            </div>

            <div className="space-y-1">
              <label className="label" htmlFor="judging_mode">Judging Mode</label>
              <select id="judging_mode" name="judging_mode" className="input">
                <option value="rubric">Rubric (sliders per criterion)</option>
                <option value="pairwise">Pairwise (A vs B comparisons)</option>
                <option value="hybrid">Hybrid (both)</option>
              </select>
            </div>
          </div>

          {/* Criteria editor */}
          <div className="card space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-white">Judging Criteria</h2>
              <span className={`text-xs ${Math.abs(totalWeight - 1) > 0.01 ? 'text-red-400' : 'text-green-400'}`}>
                Total weight: {Math.round(totalWeight * 100)}%
              </span>
            </div>

            {criteria.map((c, i) => (
              <div key={c.key} className="flex items-center gap-3 py-2 border-b border-white/[0.06]">
                <div className="flex-1">
                  <div className="text-sm text-white font-medium">{c.label}</div>
                  <div className="text-xs text-gray-500">{c.description}</div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <input
                    type="number"
                    min={0}
                    max={100}
                    step={5}
                    value={Math.round(c.weight * 100)}
                    onChange={(e) => {
                      const updated = [...criteria]
                      updated[i] = { ...c, weight: parseInt(e.target.value) / 100 }
                      setCriteria(updated)
                    }}
                    className="w-16 input text-center text-sm py-1"
                  />
                  <span className="text-gray-500 text-sm">%</span>
                </div>
              </div>
            ))}
          </div>

          {error && <div className="text-red-400 text-sm">{error}</div>}

          <div className="flex gap-3">
            <Button type="submit" loading={isPending} className="flex-1">
              Create Event
            </Button>
            <Link href="/events">
              <Button type="button" variant="secondary">Cancel</Button>
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
