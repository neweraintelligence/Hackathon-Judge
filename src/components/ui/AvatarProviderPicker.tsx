'use client'

import { useEffect, useState } from 'react'

export type AvatarProvider = 'did' | 'heygen'

const DID_THUMBNAIL =
  'https://clips-presenters.d-id.com/v2/Amber_BlackJacket_HomeOffice/9WuHtiUDnL/Sc6QllBjEE/thumbnail.png'

interface Props {
  onSelect: (provider: AvatarProvider) => void
  onCancel: () => void
}

export function AvatarProviderPicker({ onSelect, onCancel }: Props) {
  const [heygenName, setHeygenName] = useState('Katya')
  const [heygenPreviewUrl, setHeygenPreviewUrl] = useState<string | null>(null)
  const [hovered, setHovered] = useState<AvatarProvider | null>(null)
  const [selected, setSelected] = useState<AvatarProvider | null>(null)

  useEffect(() => {
    fetch('/api/avatar/heygen/info')
      .then((r) => r.json())
      .then((d) => {
        if (d.name) setHeygenName(d.name)
        if (d.previewUrl) setHeygenPreviewUrl(d.previewUrl)
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onCancel() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onCancel])

  function pick(p: AvatarProvider) {
    setSelected(p)
    setTimeout(() => onSelect(p), 260)
  }

  return (
    <div className="overlay" onClick={onCancel}>
      <div
        className="anim-pop-in"
        style={{ width: '100%', maxWidth: 640, padding: '0 20px' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 26 }}>
          <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--purple2)', marginBottom: 9 }}>
            Choose Avatar Engine
          </div>
          <p style={{ color: 'var(--muted2)', fontSize: 13, lineHeight: 1.5 }}>
            Two live rendering engines, same Avatar Judge intelligence
          </p>
        </div>

        {/* Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>

          {/* D-ID / Amber */}
          <button
            className={`av-card${selected === 'did' ? ' av-card-selected' : ''}`}
            style={hovered === 'did' && selected !== 'did' ? {
              borderColor: 'rgba(124,92,252,0.5)',
              transform: 'scale(1.022) translateY(-3px)',
              boxShadow: '0 0 36px rgba(124,92,252,0.13), 0 16px 40px rgba(0,0,0,0.5)',
            } : {}}
            onMouseEnter={() => setHovered('did')}
            onMouseLeave={() => setHovered(null)}
            onClick={() => pick('did')}
          >
            <div style={{ aspectRatio: '4/3', overflow: 'hidden', background: '#080810', position: 'relative' }}>
              <img
                src={DID_THUMBNAIL}
                alt="Amber"
                style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top' }}
              />
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 70, background: 'linear-gradient(to top, #0d0d12, transparent)' }} />
              <div style={{ position: 'absolute', top: 10, right: 10, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 5, padding: '2px 7px', fontSize: 10, fontWeight: 600, color: 'var(--muted2)', letterSpacing: '0.08em' }}>
                D-ID
              </div>
            </div>
            <div style={{ padding: '14px 16px 18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontWeight: 700, fontSize: 15, color: 'var(--text)' }}>Amber</span>
              </div>
              <div style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.6 }}>
                Sub-200ms · ElevenLabs voice · Manual WebRTC
              </div>
            </div>
            {selected === 'did' && <SelectedOverlay />}
          </button>

          {/* HeyGen / Katya */}
          <button
            className={`av-card${selected === 'heygen' ? ' av-card-selected' : ''}`}
            style={hovered === 'heygen' && selected !== 'heygen' ? {
              borderColor: 'rgba(124,92,252,0.5)',
              transform: 'scale(1.022) translateY(-3px)',
              boxShadow: '0 0 36px rgba(124,92,252,0.13), 0 16px 40px rgba(0,0,0,0.5)',
            } : {}}
            onMouseEnter={() => setHovered('heygen')}
            onMouseLeave={() => setHovered(null)}
            onClick={() => pick('heygen')}
          >
            <div style={{ aspectRatio: '4/3', overflow: 'hidden', background: '#07080f', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {heygenPreviewUrl ? (
                <img
                  src={heygenPreviewUrl}
                  alt="Katya"
                  style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top' }}
                />
              ) : (
                <svg width="100%" height="100%" viewBox="0 0 300 225" preserveAspectRatio="xMidYMid slice">
                  <defs>
                    <radialGradient id="hgBg" cx="50%" cy="35%" r="65%">
                      <stop offset="0%" stopColor="#181525" />
                      <stop offset="100%" stopColor="#07080f" />
                    </radialGradient>
                  </defs>
                  <rect width="300" height="225" fill="url(#hgBg)" />
                  {[0,1,2,3,4,5,6,7].map((i) => (
                    <line key={i} x1={i*43} y1="0" x2={i*43} y2="225" stroke="rgba(255,255,255,0.018)" strokeWidth="1" />
                  ))}
                  <ellipse cx="150" cy="85" rx="30" ry="34" fill="rgba(210,215,240,0.1)" />
                  <path d="M88 230 Q150 175 212 230" fill="rgba(210,215,240,0.08)" />
                  <circle cx="150" cy="85" r="38" fill="none" stroke="rgba(61,106,243,0.2)" strokeWidth="1" strokeDasharray="5 4" />
                </svg>
              )}
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 70, background: 'linear-gradient(to top, #07080f, transparent)' }} />
              <div style={{ position: 'absolute', top: 10, right: 10, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 5, padding: '2px 7px', fontSize: 10, fontWeight: 600, color: 'var(--muted2)', letterSpacing: '0.08em' }}>
                HeyGen
              </div>
              <div style={{ position: 'absolute', top: 10, left: 10, display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(25,212,138,0.12)', border: '1px solid rgba(25,212,138,0.25)', borderRadius: 5, padding: '2px 8px', fontSize: 10, fontWeight: 600, color: 'var(--green)' }}>
                <span className="live-dot" />LIVE
              </div>
            </div>
            <div style={{ padding: '14px 16px 18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontWeight: 700, fontSize: 15, color: 'var(--text)' }}>{heygenName}</span>
              </div>
              <div style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.6 }}>
                LiveKit stream · Custom avatar · SDK managed
              </div>
            </div>
            {selected === 'heygen' && <SelectedOverlay />}
          </button>
        </div>

        {/* Cancel */}
        <div style={{ textAlign: 'center', marginTop: 20 }}>
          <button
            onClick={onCancel}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 12, color: 'var(--muted)', transition: 'color 0.18s' }}
            onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--muted2)' }}
            onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--muted)' }}
          >
            Cancel · Esc
          </button>
        </div>
      </div>
    </div>
  )
}

function SelectedOverlay() {
  return (
    <div style={{ position: 'absolute', inset: 0, background: 'rgba(124,92,252,0.06)', borderRadius: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}>
      <div style={{ width: 46, height: 46, borderRadius: '50%', background: 'var(--purple)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 28px rgba(124,92,252,0.55)' }}>
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <path d="M3.5 9l4 4 7-8" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    </div>
  )
}
