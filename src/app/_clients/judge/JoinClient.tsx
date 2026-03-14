'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { claimJudgeInvite } from '@/lib/actions/judges'
import type { Judge } from '@/types'
import { Button } from '@/components/ui/Button'

interface Props {
  judge: Judge
  token: string
}

export function JoinClient({ judge, token }: Props) {
  const [email, setEmail] = useState(judge.email)
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function sendMagicLink() {
    setLoading(true)
    setError(null)
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?next=/events`,
        },
      })
      if (error) throw error
      setSent(true)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-6">
      <div className="card max-w-md w-full text-center space-y-6">
        <div>
          <div className="text-4xl mb-3">⚖️</div>
          <h1 className="text-2xl font-bold text-white">You're invited to judge</h1>
          <p className="text-gray-400 mt-1 text-sm">
            You've been invited as a judge. Sign in with a magic link to get started.
          </p>
        </div>

        {sent ? (
          <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4">
            <div className="text-green-400 font-medium">Check your inbox</div>
            <div className="text-gray-400 text-sm mt-1">
              We sent a magic link to <strong>{email}</strong>. Click it to sign in.
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input"
              placeholder="your@email.com"
            />
            {error && <div className="text-red-400 text-sm">{error}</div>}
            <Button onClick={sendMagicLink} loading={loading} className="w-full">
              Send Magic Link
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
