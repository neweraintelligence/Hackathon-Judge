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
    <div className="min-h-screen bg-[#0a0a0f]">
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="mb-8">
          <div className="label mb-1">Judge Queue</div>
          <h1 className="text-2xl font-bold text-white">{event.name}</h1>
          <p className="text-gray-500 text-sm mt-1">
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
