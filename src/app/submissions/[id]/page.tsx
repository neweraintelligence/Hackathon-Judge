import { notFound } from 'next/navigation'
import { getSubmissionWithAnalysis } from '@/lib/supabase/queries'
import { SubmissionReportClient } from '@/app/_clients/submissions/SubmissionReportClient'

export const revalidate = 0

export default async function SubmissionReportPage({ params }: { params: { id: string } }) {
  const submission = await getSubmissionWithAnalysis(params.id)
  if (!submission) notFound()

  return <SubmissionReportClient submission={submission} />
}
