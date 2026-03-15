import { NextRequest, NextResponse } from 'next/server'
import { runFullPipeline } from '@/lib/analysis/pipeline'
import { createServiceClient } from '@/lib/supabase/server'

export const maxDuration = 300

export async function POST(req: NextRequest) {
  try {
    const { submissionId } = await req.json()
    if (!submissionId) return NextResponse.json({ error: 'submissionId required' }, { status: 400 })

    const supabase = createServiceClient()

    // Fetch submission + event
    const { data: submission, error } = await supabase
      .from('submissions')
      .select('*, events(*), submission_media(*)')
      .eq('id', submissionId)
      .single()

    if (error || !submission) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 })
    }

    const screenshotUrls = (submission.submission_media || [])
      .filter((m: any) => m.type === 'screenshot')
      .sort((a: any, b: any) => a.sort_order - b.sort_order)
      .map((m: any) => m.storage_url)

    // Run pipeline and await it — keeps connection open so Render doesn't kill it
    await runFullPipeline(
      submissionId,
      submission.event_id,
      submission.github_url,
      submission.team_name,
      submission.events.criteria_config,
      screenshotUrls
    )

    return NextResponse.json({ ok: true, message: 'Analysis pipeline started' })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
