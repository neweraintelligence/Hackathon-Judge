import Link from 'next/link'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between px-8 py-5 border-b border-white/5">
        <div className="flex items-center gap-2">
          <span className="text-xl font-bold text-white tracking-tight">
            cursor<span className="text-purple-500">judging</span>
          </span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/events" className="btn-secondary text-sm">
            Events
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <main className="relative z-10 flex flex-col items-center justify-center min-h-[calc(100vh-72px)] px-6 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-600/10 border border-purple-500/20 text-purple-400 text-xs font-medium mb-6">
          <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
          AI-Powered Hackathon Analysis
        </div>

        <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight tracking-tight">
          Judge faster.<br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-purple-600">
            Judge better.
          </span>
        </h1>

        <p className="text-xl text-gray-400 max-w-2xl mb-10 leading-relaxed">
          Multi-pass AI analysis with extended thinking. Pool-relative scoring.
          Collaborative judge interface. Built to eliminate grade inflation and surface
          genuine engineering creativity.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-4">
          <Link href="/events/new" className="btn-primary text-base px-8 py-3 rounded-xl shadow-glow">
            Create Event
          </Link>
          <Link href="/events" className="btn-secondary text-base px-8 py-3 rounded-xl">
            View Events
          </Link>
        </div>

        {/* Feature grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-20 max-w-3xl w-full">
          {[
            {
              icon: '🔬',
              title: '6-Pass Analysis',
              desc: 'Repo archaeology → Code deep dive → Innovation audit → Visual analysis → Pool comparison → Synthesis',
            },
            {
              icon: '⚖️',
              title: 'Pool-Relative Scoring',
              desc: 'Scores are normalized against the full submission pool. No more grade inflation or isolated 8/10s.',
            },
            {
              icon: '🤝',
              title: 'Multi-Judge Interface',
              desc: 'Magic link invites, rubric sliders, pairwise comparison mode, live leaderboard via Realtime.',
            },
          ].map((f) => (
            <div key={f.title} className="card text-left">
              <div className="text-2xl mb-3">{f.icon}</div>
              <div className="font-semibold text-white mb-1 text-sm">{f.title}</div>
              <div className="text-gray-500 text-xs leading-relaxed">{f.desc}</div>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
