import { NextRequest, NextResponse } from 'next/server'

const DID_API = 'https://api.d-id.com'

function didAuth() {
  return 'Basic ' + Buffer.from(process.env.DID_API_KEY!).toString('base64')
}

export async function POST(req: NextRequest) {
  const { stream_id, session_id, candidate } = await req.json()

  // D-ID expects candidate fields flattened at the top level:
  // { candidate, sdpMid, sdpMLineIndex, session_id }
  // NOT nested as { candidate: { candidate, sdpMid, ... }, session_id }
  const body = candidate
    ? {
        session_id,
        candidate: candidate.candidate,
        sdpMid: candidate.sdpMid,
        sdpMLineIndex: candidate.sdpMLineIndex,
      }
    : { session_id }

  const res = await fetch(`${DID_API}/clips/streams/${stream_id}/ice`, {
    method: 'POST',
    headers: {
      Authorization: didAuth(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  const data = await res.json().catch(() => ({}))
  if (!res.ok) return NextResponse.json(data, { status: res.status })
  return NextResponse.json(data)
}
