'use server'
import { createServiceClient } from '@/lib/supabase/server'
import { DEFAULT_CRITERIA } from '@/lib/constants/criteria'
import type { Event, CriterionConfig, JudgingMode } from '@/types'
import { revalidatePath } from 'next/cache'

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

export async function createEvent(formData: FormData): Promise<{ slug?: string; error?: string }> {
  const name = formData.get('name') as string
  const date = formData.get('date') as string
  const judgingMode = (formData.get('judging_mode') as JudgingMode) || 'rubric'
  const criteriaJson = formData.get('criteria_config') as string

  if (!name || !date) return { error: 'Name and date are required.' }

  let criteria: CriterionConfig[] = DEFAULT_CRITERIA
  if (criteriaJson) {
    try { criteria = JSON.parse(criteriaJson) } catch {}
  }

  const slug = slugify(name) + '-' + Date.now().toString(36)
  const supabase = createServiceClient()

  const { error } = await supabase.from('events').insert({
    name,
    slug,
    date,
    criteria_config: criteria,
    judging_mode: judgingMode,
  })

  if (error) return { error: error.message }
  revalidatePath('/events')
  return { slug }
}

export async function updateEventCriteria(
  eventId: string,
  criteria: CriterionConfig[]
): Promise<{ error?: string }> {
  const supabase = createServiceClient()
  const { error } = await supabase
    .from('events')
    .update({ criteria_config: criteria })
    .eq('id', eventId)
  if (error) return { error: error.message }
  revalidatePath('/events')
  return {}
}
