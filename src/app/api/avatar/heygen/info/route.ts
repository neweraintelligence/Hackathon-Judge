import { NextResponse } from 'next/server'

// Streaming-compatible Interactive Avatar ID
const AVATAR_ID = 'Katya_ProfessionalLook_public'

export async function GET() {
  return NextResponse.json({
    avatarId: AVATAR_ID,
    name: 'Katya',
    previewUrl: null,
  })
}
