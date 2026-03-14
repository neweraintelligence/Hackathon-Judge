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
    <div className={`inline-flex gap-2 rounded-2xl border border-white/10 bg-white/[0.04] p-1.5 ${className}`}>
      {tabs.map((tab) => (
        <button
          key={tab.key}
          onClick={() => onTabChange(tab.key)}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 ${
            activeTab === tab.key
              ? 'pill-tab-active'
              : 'pill-tab-inactive'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}
