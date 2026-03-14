'use client'

interface Tab {
  key: string
  label: string
}

interface PillTabsProps {
  tabs: Tab[]
  activeTab: string
  onTabChange: (key: string) => void
  className?: string
}

export function PillTabs({ tabs, activeTab, onTabChange, className = '' }: PillTabsProps) {
  return (
    <div className={`flex gap-2 ${className}`}>
      {tabs.map((tab) => (
        <button
          key={tab.key}
          onClick={() => onTabChange(tab.key)}
          className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-150 ${
            activeTab === tab.key
              ? 'bg-purple-600 text-white shadow-glow-sm scale-105'
              : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-gray-300'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}
