'use client'
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createEvent } from '@/lib/actions/events'
import { DEFAULT_CRITERIA } from '@/lib/constants/criteria'
import { TopNav } from '@/components/ui/TopNav'
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
    <>
      <TopNav
        actions={
          <Link href="/events" className="btn-ghost" style={{ fontSize: 12 }}>
            Competitions
          </Link>
        }
      />

      <div style={{ maxWidth: 540, margin: '0 auto', padding: '44px 24px' }}>
        <div className="anim-fade-up">
          <div className="label" style={{ marginBottom: 10 }}>
            <Link href="/events" style={{ color: 'inherit', textDecoration: 'none' }}>← Competitions</Link>
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 6, color: 'var(--text)' }}>
            New Hackathon Competition
          </h1>
          <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 30 }}>
            Set up the standard HJ first round, attendee leaderboard, and top-8 human final.
          </p>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Basic fields */}
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              {[
                { label: 'Competition Name', name: 'name', placeholder: 'e.g. Cursor Calgary Hackathon 2026', type: 'text' },
                { label: 'Hackathon Date',   name: 'date', placeholder: '',                                      type: 'date' },
              ].map((f) => (
                <div key={f.name}>
                  <div className="label" style={{ marginBottom: 7 }}>{f.label}</div>
                  <input
                    name={f.name}
                    type={f.type}
                    placeholder={f.placeholder}
                    className="input"
                    required
                  />
                </div>
              ))}

              <div style={{ padding: 14, borderRadius: 12, border: '1px solid rgba(124,92,252,0.2)', background: 'rgba(124,92,252,0.055)' }}>
                <div className="label" style={{ color: 'var(--purple2)', marginBottom: 8 }}>Hackathon Mode</div>
                <div style={{ fontSize: 13, color: 'var(--text)', fontWeight: 600, marginBottom: 5 }}>
                  HJ first round plus top-8 human finals
                </div>
                <div style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.6 }}>
                  Teams upload project repos to the portal, Hackathon Judge returns scores and rationale,
                  attendees see the leaderboard, and the selected finalists move into human judge scorecards.
                </div>
                <input type="hidden" name="judging_mode" value="hackathon" />
              </div>
            </div>

            {/* Criteria editor */}
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text)' }}>Judging Criteria</div>
                <span style={{ fontSize: 12, color: Math.abs(totalWeight - 1) > 0.01 ? 'var(--red)' : 'var(--green)' }}>
                  Total: {Math.round(totalWeight * 100)}%
                </span>
              </div>

              {criteria.map((c, i) => (
                <div key={c.key} style={{ display: 'flex', alignItems: 'center', gap: 12, paddingBottom: 12, borderBottom: i < criteria.length - 1 ? '1px solid var(--border)' : 'none' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)', marginBottom: 2 }}>{c.label}</div>
                    <div style={{ fontSize: 11, color: 'var(--muted)' }}>{c.description}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
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
                      className="input"
                      style={{ width: 60, textAlign: 'center', padding: '6px 8px' }}
                    />
                    <span style={{ fontSize: 13, color: 'var(--muted)' }}>%</span>
                  </div>
                </div>
              ))}
            </div>

            {error && (
              <div style={{ color: 'var(--red)', fontSize: 13 }}>{error}</div>
            )}

            <div style={{ display: 'flex', gap: 10 }}>
              <button
                type="submit"
                className="btn-primary"
                disabled={isPending}
                style={{ flex: 1, justifyContent: 'center', padding: '11px 0', fontSize: 14, opacity: isPending ? 0.7 : 1 }}
              >
                {isPending ? 'Creating…' : 'Create Competition →'}
              </button>
              <Link href="/events" className="btn-secondary">
                Cancel
              </Link>
            </div>
          </form>
        </div>
      </div>
    </>
  )
}
