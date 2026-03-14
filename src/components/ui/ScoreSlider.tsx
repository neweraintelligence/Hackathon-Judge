'use client'

interface ScoreSliderProps {
  label: string
  value: number
  onChange: (v: number) => void
  min?: number
  max?: number
}

export function ScoreSlider({ label, value, onChange, min = 0, max = 10 }: ScoreSliderProps) {
  const percent = ((value - min) / (max - min)) * 100
  const color =
    percent >= 70 ? '#22c55e' : percent >= 40 ? '#eab308' : '#ef4444'

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-300">{label}</span>
        <span className="text-lg font-bold" style={{ color }}>
          {value.toFixed(1)}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={0.5}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
        style={{
          background: `linear-gradient(to right, ${color} 0%, ${color} ${percent}%, rgba(255,255,255,0.1) ${percent}%, rgba(255,255,255,0.1) 100%)`,
        }}
      />
    </div>
  )
}
