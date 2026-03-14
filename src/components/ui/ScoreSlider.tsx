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
    percent >= 70 ? '#16c784' : percent >= 40 ? '#f6be4f' : '#ef5f79'

  return (
    <div className="space-y-2 rounded-xl border border-white/10 bg-white/[0.02] p-3.5">
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-200">{label}</span>
        <span className="text-xl font-semibold tracking-tight" style={{ color }}>
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
        className="slider w-full cursor-pointer"
        style={{
          background: `linear-gradient(to right, ${color} 0%, ${color} ${percent}%, rgba(148, 163, 184, 0.18) ${percent}%, rgba(148, 163, 184, 0.18) 100%)`,
        }}
      />
      <div className="flex justify-between text-[10px] text-gray-500 uppercase tracking-[0.18em]">
        <span>{min}</span>
        <span>{max}</span>
      </div>
    </div>
  )
}
