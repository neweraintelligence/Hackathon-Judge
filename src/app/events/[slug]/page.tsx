import { notFound } from 'next/navigation'
import { getEventBySlug, getSubmissions, getJudges, getLeaderboard } from '@/lib/supabase/queries'
import { EventDashboardClient } from '@/app/_clients/events/EventDashboardClient'

export const revalidate = 0

export default async function EventDashboardPage({ params }: { params: { slug: string } }) {
  const event = await getEventBySlug(params.slug)
  if (!event) notFound()

  const [submissions, judges, leaderboard] = await Promise.all([
    getSubmissions(event.id),
    getJudges(event.id),
    getLeaderboard(event.id),
  ])

  return (
    <EventDashboardClient
      event={event}
      submissions={submissions}
      judges={judges}
      leaderboard={leaderboard}
    />
  )
}
