export default function JudgeScoringLoading() {
  return (
    <div className="min-h-screen">
      <div className="max-w-5xl mx-auto px-6 py-4">
        <div className="h-16 rounded-2xl border border-white/10 bg-white/[0.03] px-4 flex items-center justify-between">
          <div className="space-y-2">
            <div className="skeleton h-3 w-40 rounded-md" />
            <div className="skeleton h-4 w-56 rounded-md" />
          </div>
          <div className="skeleton h-10 w-56 rounded-xl" />
        </div>
      </div>
      <div className="max-w-5xl mx-auto px-6 py-8 space-y-4">
        <div className="card space-y-3">
          <div className="skeleton h-4 w-32 rounded-md" />
          <div className="skeleton h-8 w-64 rounded-md" />
          <div className="skeleton h-3 w-full rounded-md" />
          <div className="skeleton h-3 w-5/6 rounded-md" />
        </div>
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="card space-y-3">
            <div className="skeleton h-4 w-40 rounded-md" />
            <div className="skeleton h-3 w-full rounded-md" />
            <div className="skeleton h-3 w-11/12 rounded-md" />
          </div>
        ))}
      </div>
    </div>
  )
}
