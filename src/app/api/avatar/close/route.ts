import { NextRequest, NextResponse } from 'next/server'

const DID_API = 'https://api.d-id.com'

function didAuth() {
  return 'Basic ' + Buffer.from(process.env.DID_API_KEY!).toString('base64')
}

export async function DELETE(req: NextRequest) {
  const { stream_id, session_id } = await req.json()

  const res = await fetch(`${DID_API}/clips/streams/${stream_id}`, {
    method: 'DELETE',
    headers: {
      Authorization: didAuth(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ session_id }),
  })

  return NextResponse.json({ ok: res.ok })
}
