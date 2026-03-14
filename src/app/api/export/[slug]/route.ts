import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest, { params }: { params: { slug: string } }) {
  const supabase = createServiceClient()

  const { data: event } = await supabase
    .from('events')
    .select('id, name')
    .eq('slug', params.slug)
    .single()

  if (!event) return NextResponse.json({ error: 'Event not found' }, { status: 404 })

  const { data: rows } = await supabase
    .from('judge_scores')
    .select(`
      submission_id,
      criteria_key,
      score,
      comment,
      judges!inner(email, display_name, event_id),
      submissions!inner(team_name, github_url, event_id)
    `)
    .eq('judges.event_id', event.id)

  const { data: aiRows } = await supabase
    .from('ai_scores')
    .select(`
      submission_id,
      criteria_key,
      score,
      reasoning,
      confidence,
      submissions!inner(team_name, event_id)
    `)
    .eq('submissions.event_id', event.id)

  // Build CSV
  const lines = ['type,team_name,criteria_key,score,judge_email,comment,reasoning,confidence']

  for (const row of rows || []) {
    const r = row as any
    lines.push(
      [
        'judge',
        `"${r.submissions.team_name}"`,
        r.criteria_key,
        r.score,
        `"${r.judges.email}"`,
        `"${r.comment || ''}"`,
        '',
        '',
      ].join(',')
    )
  }

  for (const row of aiRows || []) {
    const r = row as any
    lines.push(
      [
        'ai',
        `"${r.submissions.team_name}"`,
        r.criteria_key,
        r.score,
        'AI',
        '',
        `"${(r.reasoning || '').replace(/"/g, "'")}"`,
        r.confidence,
      ].join(',')
    )
  }

  const csv = lines.join('\n')
  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="${event.name}-results.csv"`,
    },
  })
}
