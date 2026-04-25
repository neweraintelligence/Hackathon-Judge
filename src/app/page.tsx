import Link from 'next/link'

export default function LandingPage() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 24px' }}>
      {/* Hero glow */}
      <div style={{ position: 'absolute', top: '38%', left: '50%', transform: 'translate(-50%,-50%)', width: 560, height: 280, background: 'radial-gradient(ellipse, rgba(124,92,252,0.07) 0%, transparent 70%)', pointerEvents: 'none' }} />

      <div className="anim-fade-up" style={{ width: '100%', maxWidth: 360, position: 'relative' }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 11, marginBottom: 28 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 12,
            background: 'linear-gradient(135deg, var(--accent) 0%, var(--purple) 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 24px rgba(124,92,252,0.28)', flexShrink: 0,
          }}>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M3 9l4.5 4.5L15 5" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 18, letterSpacing: '-0.02em', lineHeight: 1 }}>Judging</div>
            <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>by New Era Intelligence</div>
          </div>
        </div>

        <p style={{ fontSize: 13, color: 'var(--muted2)', marginBottom: 24, lineHeight: 1.6 }}>
          Hackathon judging tool. Pick an event or create one.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[
            { label: 'Events', sub: 'View all judging sessions', href: '/events', delay: '0s' },
            { label: 'New Event', sub: 'Set up a new hackathon', href: '/events/new', delay: '0.07s' },
          ].map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="interactive-card"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                textDecoration: 'none',
                color: 'inherit',
                animation: `slideIn 0.32s ${item.delay} cubic-bezier(0.16,1,0.3,1) both`,
              }}
            >
              <div>
                <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 3, color: 'var(--text)' }}>{item.label}</div>
                <div style={{ fontSize: 12, color: 'var(--muted)' }}>{item.sub}</div>
              </div>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ color: 'var(--muted)', opacity: 0.4, flexShrink: 0 }}>
                <path d="M3.5 8h9M8.5 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
