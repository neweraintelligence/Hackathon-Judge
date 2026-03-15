import { NextResponse } from 'next/server'

const AVATAR_ID = 'Alessandra_ProfessionalLook_public'
const AVATAR_NAME = 'Katya'

let cachedPreview: string | null = null

export async function GET() {
  if (cachedPreview) {
    return NextResponse.json({
      avatarId: AVATAR_ID,
      name: AVATAR_NAME,
      previewUrl: cachedPreview,
    })
  }

  try {
    const res = await fetch('https://api.heygen.com/v1/streaming/avatar.list', {
      headers: { 'x-api-key': process.env.HEYGEN_API_KEY! },
    })

    if (res.ok) {
      const data = await res.json()
      const avatars: any[] = data.data || []
      const match = avatars.find(
        (a: any) => a.avatar_id === AVATAR_ID
      )
      if (match?.normal_preview) {
        cachedPreview = match.normal_preview
      }
    }
  } catch {}

  if (!cachedPreview) {
    try {
      const res = await fetch('https://api.heygen.com/v2/avatars', {
        headers: { 'X-Api-Key': process.env.HEYGEN_API_KEY! },
      })

      if (res.ok) {
        const data = await res.json()
        const avatars = [
          ...(data.data?.avatars || []),
          ...(data.data?.talking_photos || []),
        ]
        const match = avatars.find(
          (a: any) => a.avatar_id === AVATAR_ID || a.avatar_name === AVATAR_ID
        )
        if (match?.preview_image_url) {
          cachedPreview = match.preview_image_url
        } else if (match?.image_url) {
          cachedPreview = match.image_url
        }
      }
    } catch {}
  }

  return NextResponse.json({
    avatarId: AVATAR_ID,
    name: AVATAR_NAME,
    previewUrl: cachedPreview,
  })
}
