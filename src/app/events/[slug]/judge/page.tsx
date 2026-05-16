import { notFound } from 'next/navigation'
import { getEventBySlug, getSubmissions, getJudgeForEvent, getPairwiseComparisons } from '@/lib/supabase/queries'
import { JudgeQueueClient } from '@/app/_clients/judge/JudgeQueueClient'
import { PairwiseJudgeQueueClient } from '@/app/_clients/judge/PairwiseJudgeQueueClient'

export const revalidate = 0

export default async function JudgeQueuePage({ params }: { params: { slug: string } }) {
  const event = await getEventBySlug(params.slug)
  if (!event) notFound()

  const submissions = await getSubmissions(event.id)
  const readySubmissions = submissions
    .filter((s) => s.status === 'ready')
    .filter((s) => event.judging_mode === 'hackathon' ? s.is_finalist : true)
    .sort((a, b) => (a.finalist_rank ?? Number.MAX_SAFE_INTEGER) - (b.finalist_rank ?? Number.MAX_SAFE_INTEGER))

  if (event.judging_mode === 'pairwise') {
    const [judge, comparisons] = await Promise.all([
      getJudgeForEvent(event.id),
      getPairwiseComparisons(event.id),
    ])
    const judgeComparisons = judge ? comparisons.filter(c => c.judge_id === judge.id) : []

    return (
      <div className="min-h-screen">
        <div className="max-w-3xl mx-auto px-6 py-12">
          <div className="mb-10 fade-up">
            <div className="label mb-1">Pairwise Judging</div>
            <h1 className="text-3xl font-bold text-white tracking-tight">{event.name}</h1>
            <p className="text-gray-400 text-sm mt-2">
              {readySubmissions.length} submission{readySubmissions.length !== 1 ? 's' : ''} ready
            </p>
          </div>
          <PairwiseJudgeQueueClient
            event={event}
            submissions={readySubmissions}
            judgeId={judge?.id ?? null}
            completedComparisons={judgeComparisons}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <div className="max-w-5xl mx-auto px-6 py-12">
        <div className="mb-10 fade-up">
          <div className="label mb-1">Judge Queue</div>
          <h1 className="text-3xl font-bold text-white tracking-tight">{event.name}</h1>
          <p className="text-gray-400 text-sm mt-2">
            {event.judging_mode === 'hackathon'
              ? `${readySubmissions.length} finalist${readySubmissions.length !== 1 ? 's' : ''} ready for human scoring`
              : `${readySubmissions.length} submission${readySubmissions.length !== 1 ? 's' : ''} ready to judge`}
          </p>
        </div>
        <JudgeQueueClient
          event={event}
          submissions={readySubmissions}
        />
      </div>
    </div>
  )
}
