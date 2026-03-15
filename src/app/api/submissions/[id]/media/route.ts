import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const submissionId = params.id
  const supabase = createServiceClient()

  const form = await req.formData()
  const files = form.getAll('files') as File[]

  if (!files.length) {
    return NextResponse.json({ error: 'No files provided' }, { status: 400 })
  }

  const inserted: string[] = []

  for (let i = 0; i < files.length; i++) {
    const file = files[i]
    const ext = file.name.split('.').pop()?.toLowerCase() ?? 'bin'
    const isVideo = file.type.startsWith('video/')
    const storagePath = `${submissionId}/${Date.now()}_${i}.${ext}`

    const { error: uploadError } = await supabase.storage
      .from('submission-media')
      .upload(storagePath, file, { contentType: file.type, upsert: false })

    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 500 })
    }

    const { data: { publicUrl } } = supabase.storage
      .from('submission-media')
      .getPublicUrl(storagePath)

    const { error: dbError } = await supabase
      .from('submission_media')
      .insert({
        submission_id: submissionId,
        type: isVideo ? 'video' : 'screenshot',
        storage_url: publicUrl,
        sort_order: i,
      })

    if (dbError) {
      return NextResponse.json({ error: dbError.message }, { status: 500 })
    }

    inserted.push(publicUrl)
  }

  return NextResponse.json({ uploaded: inserted.length })
}
