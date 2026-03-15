import { NextResponse } from 'next/server'

// Stephanie's talking photo ID on this HeyGen account
const TALKING_PHOTO_ID = '53df91518de248f0b8896bf61496b2f9'

export async function GET() {
  const res = await fetch('https://api.heygen.com/v2/avatars?include_custom=true', {
    headers: { 'X-Api-Key': process.env.HEYGEN_API_KEY! },
  })
  const data = await res.json()
  const photo = (data.data?.talking_photos || []).find(
    (p: any) => p.talking_photo_id === TALKING_PHOTO_ID
  )
  return NextResponse.json({
    avatarId: TALKING_PHOTO_ID,
    name: photo?.talking_photo_name || 'Stephanie',
    previewUrl: photo?.preview_image_url || null,
  })
}
