import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getEventBySlug, getLeaderboard, getPairwiseRankings } from '@/lib/supabase/queries'
import { LeaderboardClient } from '@/app/_clients/events/LeaderboardClient'

export const revalidate = 0

export default async function LeaderboardPage({ params }: { params: { slug: string } }) {
  const event = await getEventBySlug(params.slug)
  if (!event) notFound()

  const leaderboard = event.judging_mode === 'pairwise'
    ? await getPairwiseRankings(event.id)
    : await getLeaderboard(event.id)

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      <div className="max-w-3xl mx-auto px-6 py-12">
        <div className="mb-8">
          <Link
            href={`/events/${params.slug}`}
            className="text-sm text-gray-500 hover:text-gray-300 transition-colors mb-2 inline-block"
          >
            ← {event.name}
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-white">Leaderboard</h1>
            {event.judging_mode === 'pairwise' && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-400 border border-purple-500/25 font-medium">
                Pairwise
              </span>
            )}
          </div>
        </div>
        <LeaderboardClient
          eventId={event.id}
          initialLeaderboard={leaderboard}
          judgingMode={event.judging_mode}
        />
      </div>
    </div>
  )
}
