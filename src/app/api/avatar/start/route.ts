import { NextResponse } from 'next/server'

const DID_API = 'https://api.d-id.com'
// Amber – black jacket, home office, ElevenLabs voice. Professional + authoritative.
const PRESENTER_ID = 'v2_public_Amber_BlackJacket_HomeOffice@9WuHtiUDnL'

// Public TURN relay — ensures WebRTC works through cloud/corporate NAT where direct UDP is blocked.
const FALLBACK_TURN_SERVERS = [
  {
    urls: 'stun:stun.relay.metered.ca:80',
  },
  {
    urls: 'turn:global.relay.metered.ca:80',
    username: 'openrelayproject',
    credential: 'openrelayproject',
  },
  {
    urls: 'turn:global.relay.metered.ca:80?transport=tcp',
    username: 'openrelayproject',
    credential: 'openrelayproject',
  },
  {
    urls: 'turn:global.relay.metered.ca:443',
    username: 'openrelayproject',
    credential: 'openrelayproject',
  },
  {
    urls: 'turns:global.relay.metered.ca:443?transport=tcp',
    username: 'openrelayproject',
    credential: 'openrelayproject',
  },
]

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

  // Merge D-ID's ICE servers with our fallback TURN servers so the WebRTC
  // peer connection can relay through TCP/443 when direct UDP is blocked.
  const ice_servers = [
    ...(data.ice_servers ?? []),
    ...FALLBACK_TURN_SERVERS,
  ]

  return NextResponse.json({ ...data, ice_servers })
}
