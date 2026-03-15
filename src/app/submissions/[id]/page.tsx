import { notFound } from 'next/navigation'
import { getSubmissionWithAnalysis, getEventByIdMinimal } from '@/lib/supabase/queries'
import { SubmissionReportClient } from '@/app/_clients/submissions/SubmissionReportClient'

export const revalidate = 0

export default async function SubmissionReportPage({ params }: { params: { id: string } }) {
  const submission = await getSubmissionWithAnalysis(params.id)
  if (!submission) notFound()

  const event = await getEventByIdMinimal(submission.event_id)

  return (
    <SubmissionReportClient
      submission={submission}
      aiJudgeName={event?.ai_judge_name || 'Avatar Judge'}
    />
  )
}
