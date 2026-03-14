'use server'
import { createServiceClient } from '@/lib/supabase/server'
import { ensureAIJudge } from '@/lib/ai-judge/submit-scores'
import { revalidatePath } from 'next/cache'

export async function enableAIJudge(
  eventId: string,
  eventSlug: string,
  name: string = 'Aria'
): Promise<{ judgeId?: string; error?: string }> {
  try {
    const supabase = createServiceClient()

    // Create or fetch the AI judge row
    const judgeId = await ensureAIJudge(eventId, name)

    // Mark event as AI judge enabled
    await supabase
      .from('events')
      .update({ ai_judge_enabled: true, ai_judge_name: name })
      .eq('id', eventId)

    revalidatePath(`/events/${eventSlug}`)
    return { judgeId }
  } catch (err: any) {
    return { error: err.message }
  }
}

export async function disableAIJudge(
  eventId: string,
  eventSlug: string
): Promise<{ error?: string }> {
  const supabase = createServiceClient()
  await supabase
    .from('events')
    .update({ ai_judge_enabled: false })
    .eq('id', eventId)
  revalidatePath(`/events/${eventSlug}`)
  return {}
}
