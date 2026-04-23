import Link from 'next/link'
import { getEvents } from '@/lib/supabase/queries'
import { EventRow } from '@/app/_clients/events/EventRow'

export const revalidate = 0

export default async function EventsPage() {
  let events: Awaited<ReturnType<typeof getEvents>> = []
  try {
    events = await getEvents()
  } catch {}

  return (
    <div className="min-h-screen">
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="flex items-center justify-between mb-10">
          <div>
            <Link href="/" className="text-sm text-gray-400 hover:text-gray-200 transition-colors mb-2 inline-block">
              ← Judging
            </Link>
            <h1 className="text-3xl font-bold text-white">Events</h1>
          </div>
          <Link href="/events/new" className="btn-primary">
            + New Event
          </Link>
        </div>

        {events.length === 0 ? (
          <div className="card text-center py-16 fade-up">
            <div className="label mb-2">No Events</div>
            <div className="text-gray-300 mb-4">Create your first judging session to get started.</div>
            <Link href="/events/new" className="btn-primary text-sm">
              Create your first event
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {events.map((event) => (
              <EventRow
                key={event.id}
                id={event.id}
                name={event.name}
                slug={event.slug}
                date={event.date}
                judgingMode={event.judging_mode}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
