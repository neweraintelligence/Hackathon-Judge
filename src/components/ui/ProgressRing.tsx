interface ProgressRingProps {
  score: number
  size?: number
  strokeWidth?: number
}

export function ProgressRing({ score, size = 64, strokeWidth = 5 }: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const progress = Math.max(0, Math.min(10, score)) / 10
  const dash = circumference * progress
  const color =
    score >= 7 ? '#22c55e' : score >= 4 ? '#eab308' : '#ef4444'

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.05)"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={`${dash} ${circumference - dash}`}
          strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 0.4s ease' }}
        />
      </svg>
      <span
        className="absolute text-sm font-bold"
        style={{ color }}
      >
        {score.toFixed(1)}
      </span>
    </div>
  )
}
