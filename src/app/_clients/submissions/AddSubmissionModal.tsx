'use client'
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { addSubmission } from '@/lib/actions/submissions'
import { Button } from '@/components/ui/Button'

interface Props {
  eventId: string
  onClose: () => void
}

export function AddSubmissionModal({ eventId, onClose }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [autoAnalyze, setAutoAnalyze] = useState(true)

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    setError(null)
    startTransition(async () => {
      const res = await addSubmission(eventId, {
        githubUrl: fd.get('github_url') as string,
        devpostUrl: (fd.get('devpost_url') as string) || undefined,
        teamName: fd.get('team_name') as string,
        pitchText: (fd.get('pitch_text') as string) || undefined,
      })
      if (res.error) {
        setError(res.error)
        return
      }
      // Auto-trigger analysis
      if (autoAnalyze && res.id) {
        await fetch('/api/analysis/start', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ submissionId: res.id }),
        })
      }
      router.refresh()
      onClose()
    })
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="card w-full max-w-lg space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between sticky top-0 bg-[#13131a] pb-2">
          <h2 className="font-semibold text-white">Add Submission</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-300 text-xl leading-none">&times;</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-1">
            <label className="label">Team Name *</label>
            <input name="team_name" className="input" placeholder="Team Awesome" required />
          </div>

          <div className="space-y-1">
            <label className="label">GitHub URL *</label>
            <input
              name="github_url"
              className="input"
              placeholder="https://github.com/..."
              required
              pattern="https://github\.com/.+"
            />
          </div>

          <div className="space-y-1">
            <label className="label">Devpost URL (optional)</label>
            <input name="devpost_url" className="input" placeholder="https://devpost.com/..." />
          </div>

          <div className="space-y-1">
            <label className="label">Pitch / Description (optional)</label>
            <textarea
              name="pitch_text"
              className="input min-h-[80px] resize-none"
              placeholder="What does the project do? What problem does it solve?"
            />
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={autoAnalyze}
              onChange={(e) => setAutoAnalyze(e.target.checked)}
              className="w-4 h-4 rounded accent-purple-600"
            />
            <span className="text-sm text-gray-300">Auto-start AI analysis after adding</span>
          </label>

          {error && <div className="text-red-400 text-sm">{error}</div>}

          <div className="flex gap-2 pt-2">
            <Button type="submit" loading={isPending} className="flex-1">
              Add Submission
            </Button>
            <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          </div>
        </form>
      </div>
    </div>
  )
}
