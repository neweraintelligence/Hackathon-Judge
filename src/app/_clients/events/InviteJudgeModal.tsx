'use client'
import { useState, useTransition } from 'react'
import { inviteJudge } from '@/lib/actions/judges'
import { Button } from '@/components/ui/Button'

interface Props {
  eventId: string
  onClose: () => void
}

export function InviteJudgeModal({ eventId, onClose }: Props) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [inviteLink, setInviteLink] = useState<string | null>(null)

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const email = fd.get('email') as string
    const name = fd.get('name') as string
    setError(null)
    startTransition(async () => {
      const res = await inviteJudge(eventId, email, name)
      if (res.error) {
        setError(res.error)
      } else {
        setInviteLink(`${window.location.origin}/join/${res.token}`)
      }
    })
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="card w-full max-w-md space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-white">Invite Judge</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-300 text-xl leading-none">&times;</button>
        </div>

        {inviteLink ? (
          <div className="space-y-3">
            <div className="text-sm text-gray-400">Share this link with the judge:</div>
            <div className="bg-white/5 rounded-lg p-3 font-mono text-xs text-purple-400 break-all">
              {inviteLink}
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={() => navigator.clipboard.writeText(inviteLink)}
              >
                Copy Link
              </Button>
              <Button size="sm" variant="secondary" onClick={onClose}>Done</Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="space-y-1">
              <label className="label">Email</label>
              <input name="email" type="email" className="input" placeholder="judge@example.com" required />
            </div>
            <div className="space-y-1">
              <label className="label">Display Name (optional)</label>
              <input name="name" className="input" placeholder="Judge Name" />
            </div>
            {error && <div className="text-red-400 text-sm">{error}</div>}
            <div className="flex gap-2">
              <Button type="submit" loading={isPending} className="flex-1">Send Invite</Button>
              <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
