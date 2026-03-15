import { NextResponse } from 'next/server'

const DID_API = 'https://api.d-id.com'
// Amber – black jacket, home office, ElevenLabs voice. Professional + authoritative.
const PRESENTER_ID = 'v2_public_Amber_BlackJacket_HomeOffice@9WuHtiUDnL'

function didAuth() {
  return 'Basic ' + Buffer.from(process.env.DID_API_KEY!).toString('base64')
}

export async function POST() {
  const res = await fetch(`${DID_API}/clips/streams`, {
    method: 'POST',
    headers: {
      Authorization: didAuth(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ presenter_id: PRESENTER_ID }),
  })

  const data = await res.json()
  if (!res.ok) return NextResponse.json(data, { status: res.status })
  return NextResponse.json(data)
}
