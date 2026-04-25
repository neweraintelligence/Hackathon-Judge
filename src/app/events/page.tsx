import Link from 'next/link'
import { getEvents } from '@/lib/supabase/queries'
import { EventRow } from '@/app/_clients/events/EventRow'
import { TopNav } from '@/components/ui/TopNav'

export const revalidate = 0

export default async function EventsPage() {
  let events: Awaited<ReturnType<typeof getEvents>> = []
  try {
    events = await getEvents()
  } catch {}

  return (
    <>
      <TopNav
        actions={
          <Link href="/events/new" className="btn-primary" style={{ fontSize: 12 }}>
            + New Event
          </Link>
        }
      />
      <div style={{ maxWidth: 860, margin: '0 auto', padding: '44px 24px' }}>
        <div className="anim-fade-up">
          <div style={{ marginBottom: 32 }}>
            <div className="label" style={{ marginBottom: 8 }}>All Events</div>
            <h1 style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.025em', color: 'var(--text)' }}>Events</h1>
          </div>

          {events.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '64px 24px' }}>
              <div className="label" style={{ marginBottom: 8, display: 'block', textAlign: 'center' }}>No Events</div>
              <div style={{ color: 'var(--muted2)', marginBottom: 16, fontSize: 14 }}>
                Create your first judging session to get started.
              </div>
              <Link href="/events/new" className="btn-primary">
                Create your first event
              </Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {events.map((event, i) => (
                <EventRow
                  key={event.id}
                  id={event.id}
                  name={event.name}
                  slug={event.slug}
                  date={event.date}
                  judgingMode={event.judging_mode}
                  index={i}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
