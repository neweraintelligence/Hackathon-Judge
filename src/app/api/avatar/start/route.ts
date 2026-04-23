import { NextResponse } from 'next/server'

const DID_API = 'https://api.d-id.com'
const PRESENTER_ID = 'v2_public_Amber_BlackJacket_HomeOffice@9WuHtiUDnL'

function didAuth() {
  return 'Basic ' + Buffer.from(process.env.DID_API_KEY!).toString('base64')
}

let activeStream: { id: string; session_id: string } | null = null

async function destroyStream(streamId: string, sessionId: string) {
  try {
    await fetch(`${DID_API}/clips/streams/${streamId}`, {
      method: 'DELETE',
      headers: {
        Authorization: didAuth(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ session_id: sessionId }),
    })
  } catch {}
}

export async function POST() {
  // Destroy any orphaned stream from a previous session
  if (activeStream) {
    await destroyStream(activeStream.id, activeStream.session_id)
    activeStream = null
  }

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

  activeStream = { id: data.id, session_id: data.session_id }

  return NextResponse.json(data)
}
