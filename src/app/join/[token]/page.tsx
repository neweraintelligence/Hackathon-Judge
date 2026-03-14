import { notFound } from 'next/navigation'
import { getJudgeByToken } from '@/lib/supabase/queries'
import { JoinClient } from '@/app/_clients/judge/JoinClient'

export const revalidate = 0

export default async function JoinPage({ params }: { params: { token: string } }) {
  const judge = await getJudgeByToken(params.token)
  if (!judge) notFound()

  return <JoinClient judge={judge} token={params.token} />
}
