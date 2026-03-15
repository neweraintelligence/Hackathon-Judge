'use client'
import { useId } from 'react'

interface AIJudgeAvatarProps {
  size?: number
  className?: string
  pulse?: boolean
}

export function AIJudgeAvatar({ size = 40, className = '', pulse = false }: AIJudgeAvatarProps) {
  const id = useId().replace(/:/g, '')
  const gradientId = `judgeGradient-${id}`

  return (
    <div
      className={`relative inline-flex items-center justify-center rounded-full ${className}`}
      style={{ width: size, height: size }}
    >
      {/* Outer pulse ring */}
      {pulse && (
        <span
          className="absolute inset-0 rounded-full bg-purple-500/30 animate-ping"
          style={{ animationDuration: '2.5s' }}
        />
      )}

      {/* Base circle */}
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="relative z-10"
      >
        {/* Background */}
        <circle cx="50" cy="50" r="50" fill="#1a1025" />

        {/* Outer ring */}
        <circle cx="50" cy="50" r="47" stroke="#7c3aed" strokeWidth="1.5" strokeOpacity="0.6" />

        {/* Circuit lines — horizontal */}
        <line x1="8" y1="50" x2="22" y2="50" stroke="#7c3aed" strokeWidth="1.5" strokeOpacity="0.4" />
        <line x1="78" y1="50" x2="92" y2="50" stroke="#7c3aed" strokeWidth="1.5" strokeOpacity="0.4" />

        {/* Circuit lines — vertical */}
        <line x1="50" y1="8" x2="50" y2="22" stroke="#7c3aed" strokeWidth="1.5" strokeOpacity="0.4" />
        <line x1="50" y1="78" x2="50" y2="92" stroke="#7c3aed" strokeWidth="1.5" strokeOpacity="0.4" />

        {/* Circuit nodes */}
        <circle cx="22" cy="50" r="2" fill="#7c3aed" fillOpacity="0.7" />
        <circle cx="78" cy="50" r="2" fill="#7c3aed" fillOpacity="0.7" />
        <circle cx="50" cy="22" r="2" fill="#7c3aed" fillOpacity="0.7" />
        <circle cx="50" cy="78" r="2" fill="#7c3aed" fillOpacity="0.7" />

        {/* Diagonal circuit lines */}
        <line x1="22" y1="22" x2="30" y2="30" stroke="#7c3aed" strokeWidth="1" strokeOpacity="0.3" />
        <line x1="78" y1="22" x2="70" y2="30" stroke="#7c3aed" strokeWidth="1" strokeOpacity="0.3" />
        <line x1="22" y1="78" x2="30" y2="70" stroke="#7c3aed" strokeWidth="1" strokeOpacity="0.3" />
        <line x1="78" y1="78" x2="70" y2="70" stroke="#7c3aed" strokeWidth="1" strokeOpacity="0.3" />

        {/* Inner glow circle */}
        <circle cx="50" cy="50" r="28" fill={`url(#${gradientId})`} fillOpacity="0.15" />
        <circle cx="50" cy="50" r="28" stroke="#7c3aed" strokeWidth="1" strokeOpacity="0.5" />

        {/* Eyes */}
        <rect x="36" y="41" width="8" height="5" rx="2" fill="#a78bfa" />
        <rect x="56" y="41" width="8" height="5" rx="2" fill="#a78bfa" />

        {/* Eye glow */}
        <rect x="36" y="41" width="8" height="5" rx="2" fill="#c4b5fd" fillOpacity="0.4" />
        <rect x="56" y="41" width="8" height="5" rx="2" fill="#c4b5fd" fillOpacity="0.4" />

        {/* Mouth / sensor bar */}
        <rect x="38" y="54" width="24" height="3" rx="1.5" fill="#7c3aed" fillOpacity="0.5" />
        <rect x="38" y="54" width="8" height="3" rx="1.5" fill="#a78bfa" fillOpacity="0.8" />

        {/* Center dot */}
        <circle cx="50" cy="50" r="1.5" fill="#c4b5fd" fillOpacity="0.6" />

        {/* Gradient def */}
        <defs>
          <radialGradient id={gradientId} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#7c3aed" />
            <stop offset="100%" stopColor="#1a1025" />
          </radialGradient>
        </defs>
      </svg>
    </div>
  )
}
