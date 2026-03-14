import { NextRequest, NextResponse } from 'next/server'
import { fetchRepoData } from '@/lib/github/repo-fetcher'

export async function POST(req: NextRequest) {
  try {
    const { githubUrl, hackathonDate } = await req.json()
    if (!githubUrl) return NextResponse.json({ error: 'githubUrl required' }, { status: 400 })

    const data = await fetchRepoData(githubUrl, hackathonDate)
    return NextResponse.json(data)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
