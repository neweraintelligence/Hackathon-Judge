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
  const [mode, setMode] = useState('rubric')

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
            Events
          </Link>
        }
      />

      <div style={{ maxWidth: 540, margin: '0 auto', padding: '44px 24px' }}>
        <div className="anim-fade-up">
          <div className="label" style={{ marginBottom: 10 }}>
            <Link href="/events" style={{ color: 'inherit', textDecoration: 'none' }}>← Events</Link>
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 6, color: 'var(--text)' }}>
            New Event
          </h1>
          <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 30 }}>
            Set up a new hackathon judging session.
          </p>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Basic fields */}
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              {[
                { label: 'Event Name', name: 'name', placeholder: 'e.g. SF AI Hackathon 2026', type: 'text' },
                { label: 'Date',       name: 'date', placeholder: '',                           type: 'date' },
                { label: 'Slug',       name: 'slug', placeholder: 'sf-ai-2026',                 type: 'text' },
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

              {/* Judging Mode */}
              <div>
                <div className="label" style={{ marginBottom: 9 }}>Judging Mode</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {[
                    { key: 'rubric',   label: 'Rubric',   sub: 'Score each criterion 1–10' },
                    { key: 'pairwise', label: 'Pairwise', sub: 'Rank submissions head-to-head' },
                  ].map((m) => (
                    <button
                      key={m.key}
                      type="button"
                      onClick={() => setMode(m.key)}
                      className="card"
                      style={{
                        textAlign: 'left',
                        cursor: 'pointer',
                        fontFamily: 'inherit',
                        color: 'inherit',
                        border: `1px solid ${mode === m.key ? 'rgba(61,106,243,0.4)' : 'var(--border)'}`,
                        background: mode === m.key ? 'rgba(61,106,243,0.07)' : 'var(--surface)',
                        transition: 'all 0.18s',
                        padding: '12px 16px',
                      }}
                    >
                      <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 2, color: mode === m.key ? 'var(--accent2)' : 'var(--text)' }}>
                        {m.label}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--muted)' }}>{m.sub}</div>
                    </button>
                  ))}
                </div>
                {/* Hidden input for judging_mode */}
                <input type="hidden" name="judging_mode" value={mode} />
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
                {isPending ? 'Creating…' : 'Create Event →'}
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
