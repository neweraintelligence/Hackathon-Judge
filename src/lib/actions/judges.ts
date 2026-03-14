'use server'
import { createServiceClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import crypto from 'crypto'

export async function inviteJudge(
  eventId: string,
  email: string,
  displayName?: string
): Promise<{ token?: string; error?: string }> {
  const supabase = createServiceClient()
  const token = crypto.randomBytes(24).toString('hex')

  const { error } = await supabase.from('judges').insert({
    email,
    display_name: displayName || email.split('@')[0],
    event_id: eventId,
    invite_token: token,
  })

  if (error) return { error: error.message }
  revalidatePath('/events')
  return { token }
}

export async function claimJudgeInvite(
  token: string,
  userId: string
): Promise<{ error?: string }> {
  const supabase = createServiceClient()
  const { error } = await supabase
    .from('judges')
    .update({ user_id: userId, joined_at: new Date().toISOString() })
    .eq('invite_token', token)
    .is('user_id', null)
  if (error) return { error: error.message }
  return {}
}
