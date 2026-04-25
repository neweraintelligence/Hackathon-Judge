import Link from 'next/link'
import type { ReactNode } from 'react'

interface TopNavProps {
  actions?: ReactNode
}

export function TopNav({ actions }: TopNavProps) {
  return (
    <nav className="top-nav">
      <Link
        href="/"
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: 9,
          color: 'var(--text)',
          textDecoration: 'none',
        }}
      >
        <div style={{
          width: 28,
          height: 28,
          borderRadius: 8,
          background: 'linear-gradient(135deg, var(--accent), var(--purple))',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 0 14px rgba(124,92,252,0.3)',
          flexShrink: 0,
        }}>
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
            <path d="M2 6.5l3.5 3.5 5.5-7" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <span style={{ fontWeight: 600, fontSize: 14 }}>Judging</span>
      </Link>

      {actions && (
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          {actions}
        </div>
      )}
    </nav>
  )
}
