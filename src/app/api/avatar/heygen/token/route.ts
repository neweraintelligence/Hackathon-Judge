import { NextResponse } from 'next/server'

export async function POST() {
  const res = await fetch('https://api.heygen.com/v1/streaming.create_token', {
    method: 'POST',
    headers: {
      'X-Api-Key': process.env.HEYGEN_API_KEY!,
      'Content-Type': 'application/json',
    },
  })

  const data = await res.json()
  if (!res.ok) return NextResponse.json(data, { status: res.status })
  return NextResponse.json({ token: data.data.token })
}
