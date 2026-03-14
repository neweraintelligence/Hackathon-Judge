export default function JudgeQueueLoading() {
  return (
    <div className="min-h-screen">
      <div className="max-w-5xl mx-auto px-6 py-12">
        <div className="mb-10 space-y-3">
          <div className="skeleton h-3 w-28 rounded-md" />
          <div className="skeleton h-8 w-80 rounded-md" />
          <div className="skeleton h-4 w-56 rounded-md" />
        </div>
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="card h-24 flex items-center justify-between">
              <div className="space-y-2 w-2/3">
                <div className="skeleton h-4 w-1/3 rounded-md" />
                <div className="skeleton h-3 w-1/2 rounded-md" />
                <div className="skeleton h-3 w-3/4 rounded-md" />
              </div>
              <div className="skeleton h-8 w-24 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
