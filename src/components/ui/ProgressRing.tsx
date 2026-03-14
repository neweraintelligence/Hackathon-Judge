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
    score >= 7 ? '#16c784' : score >= 4 ? '#f6be4f' : '#ef5f79'

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(151, 165, 194, 0.2)"
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
          style={{
            transition: 'stroke-dasharray 0.4s ease, stroke 0.25s ease',
            filter: 'drop-shadow(0 2px 8px rgba(0, 0, 0, 0.25))',
          }}
        />
      </svg>
      <span
        className="absolute text-sm font-semibold tracking-tight"
        style={{ color }}
      >
        {score.toFixed(1)}
      </span>
    </div>
  )
}
