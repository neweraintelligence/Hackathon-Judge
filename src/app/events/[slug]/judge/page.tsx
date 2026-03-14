import { notFound } from 'next/navigation'
import { getEventBySlug, getSubmissions } from '@/lib/supabase/queries'
import { JudgeQueueClient } from '@/app/_clients/judge/JudgeQueueClient'

export const revalidate = 0

export default async function JudgeQueuePage({ params }: { params: { slug: string } }) {
  const event = await getEventBySlug(params.slug)
  if (!event) notFound()

  const submissions = await getSubmissions(event.id)
  const readySubmissions = submissions.filter((s) => s.status === 'ready')

  return (
    <div className="min-h-screen">
      <div className="max-w-5xl mx-auto px-6 py-12">
        <div className="mb-10 fade-up">
          <div className="label mb-1">Judge Queue</div>
          <h1 className="text-3xl font-bold text-white tracking-tight">{event.name}</h1>
          <p className="text-gray-400 text-sm mt-2">
            {readySubmissions.length} submission{readySubmissions.length !== 1 ? 's' : ''} ready to judge
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
