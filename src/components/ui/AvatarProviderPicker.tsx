'use client'

import { useEffect, useState } from 'react'

export type AvatarProvider = 'did' | 'heygen'

// D-ID Amber static thumbnail (doesn't expire)
const DID_THUMBNAIL =
  'https://clips-presenters.d-id.com/v2/Amber_BlackJacket_HomeOffice/9WuHtiUDnL/Sc6QllBjEE/thumbnail.png'

interface Props {
  onSelect: (provider: AvatarProvider) => void
  onCancel: () => void
}

export function AvatarProviderPicker({ onSelect, onCancel }: Props) {
  const [heygenPreview, setHeygenPreview] = useState<string | null>(null)
  const [heygenName, setHeygenName] = useState('Alessandra')
  const [hovered, setHovered] = useState<AvatarProvider | null>(null)

  useEffect(() => {
    fetch('/api/avatar/heygen/info')
      .then((r) => r.json())
      .then((d) => {
        if (d.previewUrl) setHeygenPreview(d.previewUrl)
        if (d.name) setHeygenName(d.name)
      })
      .catch(() => {})
  }, [])

  // Esc to cancel
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onCancel() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onCancel])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-xl mx-4 space-y-5 fade-up">

        {/* Header */}
        <div className="text-center">
          <div className="text-xs font-medium text-purple-300 tracking-widest uppercase mb-2">
            Choose Avatar Engine
          </div>
          <p className="text-gray-500 text-sm">Two live rendering engines, same Avatar Judge intelligence</p>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-2 gap-3">
          {/* D-ID */}
          <button
            onClick={() => onSelect('did')}
            onMouseEnter={() => setHovered('did')}
            onMouseLeave={() => setHovered(null)}
            className={`
              group relative overflow-hidden rounded-2xl border text-left transition-all duration-200
              ${hovered === 'did'
                ? 'border-purple-500/60 bg-purple-500/10 scale-[1.02]'
                : 'border-white/10 bg-white/4 hover:border-white/20'}
            `}
          >
            {/* Avatar image */}
            <div className="aspect-[4/3] overflow-hidden bg-white/5">
              <img
                src={DID_THUMBNAIL}
                alt="Amber"
                className="w-full h-full object-cover object-top"
              />
            </div>
            <div className="p-4">
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold text-white text-sm">Amber</span>
                <span className="text-xs text-gray-500 border border-white/10 px-1.5 py-0.5 rounded">D-ID</span>
              </div>
              <div className="text-xs text-gray-500 leading-relaxed">
                Sub-200ms · ElevenLabs voice · Manual WebRTC
              </div>
            </div>
          </button>

          {/* HeyGen */}
          <button
            onClick={() => onSelect('heygen')}
            onMouseEnter={() => setHovered('heygen')}
            onMouseLeave={() => setHovered(null)}
            className={`
              group relative overflow-hidden rounded-2xl border text-left transition-all duration-200
              ${hovered === 'heygen'
                ? 'border-purple-500/60 bg-purple-500/10 scale-[1.02]'
                : 'border-white/10 bg-white/4 hover:border-white/20'}
            `}
          >
            <div className="aspect-[4/3] overflow-hidden bg-white/5 flex items-center justify-center">
              {heygenPreview ? (
                <img
                  src={heygenPreview}
                  alt={heygenName}
                  className="w-full h-full object-cover object-top"
                />
              ) : (
                <div className="text-gray-700 text-4xl">◈</div>
              )}
            </div>
            <div className="p-4">
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold text-white text-sm">{heygenName}</span>
                <span className="text-xs text-gray-500 border border-white/10 px-1.5 py-0.5 rounded">HeyGen</span>
              </div>
              <div className="text-xs text-gray-500 leading-relaxed">
                LiveKit stream · Custom avatar · SDK managed
              </div>
            </div>
          </button>
        </div>

        {/* Cancel */}
        <div className="text-center">
          <button
            onClick={onCancel}
            className="text-xs text-gray-600 hover:text-gray-400 transition-colors"
          >
            Cancel · Esc
          </button>
        </div>
      </div>
    </div>
  )
}
