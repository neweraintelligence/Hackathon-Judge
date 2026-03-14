import { notFound } from 'next/navigation'
import { getEventBySlug, getSubmissionWithAnalysis } from '@/lib/supabase/queries'
import { JudgeScoringClient } from '@/app/_clients/judge/JudgeScoringClient'

export const revalidate = 0

export default async function JudgeScoringPage({
  params,
}: {
  params: { slug: string; submissionId: string }
}) {
  const [event, submission] = await Promise.all([
    getEventBySlug(params.slug),
    getSubmissionWithAnalysis(params.submissionId),
  ])

  if (!event || !submission) notFound()

  return (
    <div className="min-h-screen">
      <JudgeScoringClient event={event} submission={submission} />
    </div>
  )
}
