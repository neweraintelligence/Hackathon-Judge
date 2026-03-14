import Link from 'next/link'
import { getEvents } from '@/lib/supabase/queries'

export const revalidate = 0

export default async function EventsPage() {
  let events: Awaited<ReturnType<typeof getEvents>> = []
  try {
    events = await getEvents()
  } catch {}

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="flex items-center justify-between mb-10">
          <div>
            <Link href="/" className="text-sm text-gray-500 hover:text-gray-300 transition-colors mb-2 inline-block">
              ← cursor<span className="text-purple-500">judging</span>
            </Link>
            <h1 className="text-3xl font-bold text-white">Events</h1>
          </div>
          <Link href="/events/new" className="btn-primary">
            + New Event
          </Link>
        </div>

        {events.length === 0 ? (
          <div className="card text-center py-16">
            <div className="text-4xl mb-3">🏆</div>
            <div className="text-gray-400 mb-4">No events yet</div>
            <Link href="/events/new" className="btn-primary text-sm">
              Create your first event
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {events.map((event) => (
              <Link
                key={event.id}
                href={`/events/${event.slug}`}
                className="card flex items-center justify-between hover:border-purple-500/30 hover:shadow-glow transition-all duration-200 block"
              >
                <div>
                  <div className="font-semibold text-white mb-0.5">{event.name}</div>
                  <div className="text-sm text-gray-500">
                    {new Date(event.date).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                    {' · '}
                    <span className="capitalize">{event.judging_mode} mode</span>
                  </div>
                </div>
                <div className="text-gray-600 text-sm">→</div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
