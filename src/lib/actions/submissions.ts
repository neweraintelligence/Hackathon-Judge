'use server'
import { createServiceClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function addSubmission(
  eventId: string,
  data: {
    githubUrl: string
    devpostUrl?: string
    teamName: string
    pitchText?: string
  }
): Promise<{ id?: string; error?: string }> {
  const supabase = createServiceClient()

  const { data: row, error } = await supabase
    .from('submissions')
    .insert({
      event_id: eventId,
      github_url: data.githubUrl,
      devpost_url: data.devpostUrl || null,
      team_name: data.teamName,
      pitch_text: data.pitchText || null,
      status: 'pending',
    })
    .select('id')
    .single()

  if (error) return { error: error.message }
  revalidatePath(`/events`)
  return { id: row.id }
}

export async function deleteSubmission(submissionId: string): Promise<{ error?: string }> {
  const supabase = createServiceClient()
  const { error } = await supabase
    .from('submissions')
    .delete()
    .eq('id', submissionId)
  if (error) return { error: error.message }
  revalidatePath('/events')
  return {}
}

export async function clearAllSubmissions(eventId: string): Promise<{ error?: string }> {
  const supabase = createServiceClient()
  const { error } = await supabase
    .from('submissions')
    .delete()
    .eq('event_id', eventId)
  if (error) return { error: error.message }
  revalidatePath('/events')
  return {}
}

export async function updateSubmissionStatus(
  submissionId: string,
  status: string
): Promise<void> {
  const supabase = createServiceClient()
  await supabase
    .from('submissions')
    .update({ status })
    .eq('id', submissionId)
}

export async function saveFinalists(
  eventId: string,
  submissionIds: string[]
): Promise<{ error?: string }> {
  if (submissionIds.length > 8) return { error: 'Hackathon finals are capped at 8 teams.' }

  const uniqueIds = Array.from(new Set(submissionIds))
  if (uniqueIds.length !== submissionIds.length) return { error: 'Finalist selections include duplicates.' }

  const supabase = createServiceClient()

  if (uniqueIds.length > 0) {
    const { data: rows, error: lookupError } = await supabase
      .from('submissions')
      .select('id')
      .eq('event_id', eventId)
      .in('id', uniqueIds)

    if (lookupError) return { error: lookupError.message }
    if ((rows ?? []).length !== uniqueIds.length) {
      return { error: 'Every finalist must belong to this hackathon.' }
    }
  }

  const { error: resetError } = await supabase
    .from('submissions')
    .update({
      is_finalist: false,
      finalist_rank: null,
      finalist_selected_at: null,
    })
    .eq('event_id', eventId)

  if (resetError) return { error: resetError.message }

  for (const [index, submissionId] of uniqueIds.entries()) {
    const { error } = await supabase
      .from('submissions')
      .update({
        is_finalist: true,
        finalist_rank: index + 1,
        finalist_selected_at: new Date().toISOString(),
      })
      .eq('event_id', eventId)
      .eq('id', submissionId)

    if (error) return { error: error.message }
  }

  revalidatePath('/events')
  return {}
}
