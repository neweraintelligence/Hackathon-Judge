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
