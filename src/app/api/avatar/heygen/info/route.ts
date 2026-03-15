import { NextResponse } from 'next/server'

// Streaming-compatible Interactive Avatar ID
const AVATAR_ID = 'Anastasia_ProfessionalLook_public'

export async function GET() {
  return NextResponse.json({
    avatarId: AVATAR_ID,
    name: 'Anastasia',
    previewUrl: null,
  })
}
