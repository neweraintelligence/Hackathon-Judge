import { NextRequest, NextResponse } from 'next/server'

const DID_API = 'https://api.d-id.com'
// Amber's ElevenLabs voice
const VOICE = { type: 'elevenlabs', voice_id: 'Dimf6681ffz3PTVPPAEX' }

function didAuth() {
  return 'Basic ' + Buffer.from(process.env.DID_API_KEY!).toString('base64')
}

export async function POST(req: NextRequest) {
  const { stream_id, session_id, text } = await req.json()

  const res = await fetch(`${DID_API}/clips/streams/${stream_id}`, {
    method: 'POST',
    headers: {
      Authorization: didAuth(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      session_id,
      script: {
        type: 'text',
        input: text,
        provider: VOICE,
      },
      config: { stitch: true },
    }),
  })

  const data = await res.json().catch(() => ({}))
  if (!res.ok) return NextResponse.json(data, { status: res.status })
  return NextResponse.json(data)
}
