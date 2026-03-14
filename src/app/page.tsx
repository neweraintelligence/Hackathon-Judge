import Link from 'next/link'

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      <nav className="relative z-10 border-b border-white/10">
        <div className="mx-auto max-w-6xl flex items-center justify-between px-6 py-5">
          <div className="text-lg font-semibold tracking-tight text-white">
            cursor<span className="text-blue-300">judging</span>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/events" className="btn-ghost text-sm">
              Events
            </Link>
            <Link href="/events/new" className="btn-secondary text-sm">
              New Event
            </Link>
          </div>
        </div>
      </nav>

      <main className="relative z-10 mx-auto max-w-6xl px-6 pt-20 pb-24">
        <section className="grid grid-cols-1 lg:grid-cols-[1.25fr_0.75fr] gap-12 items-start">
          <div className="space-y-8 fade-up">
            <div className="inline-flex items-center rounded-full border border-white/12 bg-white/5 px-3 py-1 text-[11px] font-medium tracking-[0.08em] text-gray-300">
              AI-assisted Hackathon Judging
            </div>

            <div className="space-y-5 max-w-2xl">
              <h1 className="text-5xl md:text-6xl font-semibold tracking-tight leading-[1.04] text-white">
                Structured judging for serious technical competitions.
              </h1>
              <p className="text-lg text-gray-300 leading-relaxed max-w-xl">
                Replace subjective score inflation with multi-pass analysis, normalized ranking, and a purpose-built judge workflow.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-1">
              <Link href="/events/new" className="btn-primary text-sm px-6 py-3">
                Create Event
              </Link>
              <Link href="/events" className="btn-secondary text-sm px-6 py-3">
                View Events
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4">
              {[
                ['6', 'analysis passes'],
                ['pool-relative', 'ranking model'],
                ['multi-judge', 'live score sync'],
              ].map(([value, label]) => (
                <div key={label} className="card py-4">
                  <div className="text-white text-lg font-semibold tracking-tight">{value}</div>
                  <div className="text-[12px] uppercase tracking-[0.14em] text-gray-500 mt-1">{label}</div>
                </div>
              ))}
            </div>
          </div>

          <aside className="card fade-up">
            <div className="label mb-2">Judge Workflow</div>
            <h2 className="text-white text-xl font-semibold tracking-tight mb-6">Built for confidence, not speed alone.</h2>
            <div className="space-y-4">
              {[
                ['01', 'Ingest', 'GitHub + Devpost context is parsed into a consistent submission record.'],
                ['02', 'Analyze', 'Six evaluation passes generate technical, UX, and innovation evidence.'],
                ['03', 'Score', 'Judges apply rubric scores with comments and transparent weighting.'],
                ['04', 'Rank', 'Leaderboard reflects normalized results across the full submission pool.'],
              ].map(([index, title, desc]) => (
                <div key={index} className="rounded-xl border border-white/10 bg-white/[0.02] p-3.5 hover:bg-white/[0.04] transition-colors">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] tracking-[0.2em] text-blue-200">{index}</span>
                    <span className="text-sm font-medium text-white">{title}</span>
                  </div>
                  <p className="text-sm text-gray-400 leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </aside>
        </section>

        <section className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-4 fade-up">
          {[
            {
              title: 'Signal over noise',
              desc: 'Scoring is tied to evidence from repository history, architecture, and product execution.',
            },
            {
              title: 'Consistent panel behavior',
              desc: 'Each judge follows the same scoring flow with clear criteria and comment prompts.',
            },
            {
              title: 'Live operational view',
              desc: 'Track analysis progress, judge participation, and ranking outcomes in one place.',
            },
          ].map((item) => (
            <article key={item.title} className="card interactive-card">
              <h3 className="text-white font-semibold tracking-tight">{item.title}</h3>
              <p className="text-sm text-gray-400 mt-2 leading-relaxed">{item.desc}</p>
            </article>
          ))}
        </section>
      </main>
    </div>
  )
}
