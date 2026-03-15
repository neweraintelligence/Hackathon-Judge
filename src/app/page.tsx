import Link from 'next/link'

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm space-y-6 fade-up">
        <div>
          <div className="text-2xl font-semibold tracking-tight text-white mb-1">Judging</div>
          <p className="text-gray-400 text-sm">Hackathon judging tool. Pick an event or create one.</p>
        </div>

        <div className="space-y-2">
          <Link href="/events" className="interactive-card flex items-center justify-between block">
            <div>
              <div className="font-medium text-white text-sm">Events</div>
              <div className="text-xs text-gray-500 mt-0.5">View all judging sessions</div>
            </div>
            <span className="text-gray-500 text-sm">→</span>
          </Link>

          <Link href="/events/new" className="interactive-card flex items-center justify-between block">
            <div>
              <div className="font-medium text-white text-sm">New Event</div>
              <div className="text-xs text-gray-500 mt-0.5">Set up a new hackathon</div>
            </div>
            <span className="text-gray-500 text-sm">→</span>
          </Link>
        </div>
      </div>
    </div>
  )
}
