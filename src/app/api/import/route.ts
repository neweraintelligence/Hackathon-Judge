import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { DEFAULT_CRITERIA } from '@/lib/constants/criteria'

export const maxDuration = 60

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-import-secret')
  if (!secret || secret !== process.env.IMPORT_API_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: any
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { eventName, eventDate, submissions } = body
  if (!eventName || !eventDate || !Array.isArray(submissions) || submissions.length === 0) {
    return NextResponse.json(
      { error: 'eventName, eventDate, and a non-empty submissions array are required' },
      { status: 400 }
    )
  }

  const supabase = createServiceClient()

  const slug = slugify(eventName) + '-' + Date.now().toString(36)
  const { data: event, error: eventError } = await supabase
    .from('events')
    .insert({ name: eventName, slug, date: eventDate, criteria_config: DEFAULT_CRITERIA, judging_mode: 'rubric' })
    .select('id, slug')
    .single()

  if (eventError || !event) {
    return NextResponse.json({ error: eventError?.message ?? 'Failed to create event' }, { status: 500 })
  }

  const createdIds: string[] = []
  const errors: string[] = []

  for (const sub of submissions) {
    if (!sub.teamName || !sub.githubUrl) {
      errors.push(`Skipped entry missing teamName or githubUrl`)
      continue
    }

    const { data: submission, error: subError } = await supabase
      .from('submissions')
      .insert({
        event_id: event.id,
        github_url: sub.githubUrl,
        devpost_url: sub.projectUrl ?? null,
        team_name: sub.teamName,
        pitch_text: sub.pitchText ?? null,
        status: 'pending',
      })
      .select('id')
      .single()

    if (subError || !submission) {
      errors.push(`${sub.teamName}: ${subError?.message ?? 'insert failed'}`)
      continue
    }

    if (sub.previewImageUrl) {
      await supabase.from('submission_media').insert({
        submission_id: submission.id,
        type: 'screenshot',
        storage_url: sub.previewImageUrl,
        sort_order: 0,
      })
    }

    createdIds.push(submission.id)
  }

  // Fire analysis pipeline for each submission (non-blocking)
  const baseUrl = req.nextUrl.origin
  for (const id of createdIds) {
    fetch(`${baseUrl}/api/analysis/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ submissionId: id }),
    }).catch(() => {})
  }

  return NextResponse.json({ eventId: event.id, eventSlug: event.slug, created: createdIds.length, errors })
}
