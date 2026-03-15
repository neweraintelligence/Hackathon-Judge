'use client'
import { useState, useTransition, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { addSubmission } from '@/lib/actions/submissions'
import { Button } from '@/components/ui/Button'

interface Props {
  eventId: string
  onClose: () => void
}

const ACCEPT = 'image/png,image/jpeg,image/webp,image/gif,video/mp4,video/webm,video/quicktime'
const MAX_FILES = 8

export function AddSubmissionModal({ eventId, onClose }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [autoAnalyze, setAutoAnalyze] = useState(true)
  const [mediaFiles, setMediaFiles] = useState<File[]>([])
  const [uploadStatus, setUploadStatus] = useState<string>('')
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const addFiles = useCallback((incoming: FileList | null) => {
    if (!incoming) return
    const valid = Array.from(incoming).filter(
      (f) => f.type.startsWith('image/') || f.type.startsWith('video/')
    )
    setMediaFiles((prev) => [...prev, ...valid].slice(0, MAX_FILES))
  }, [])

  const removeFile = (idx: number) =>
    setMediaFiles((prev) => prev.filter((_, i) => i !== idx))

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    addFiles(e.dataTransfer.files)
  }, [addFiles])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
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
      if (res.error) { setError(res.error); return }

      // Upload media files
      if (mediaFiles.length > 0 && res.id) {
        setUploadStatus(`Uploading ${mediaFiles.length} file${mediaFiles.length > 1 ? 's' : ''}…`)
        const uploadFd = new FormData()
        mediaFiles.forEach((f) => uploadFd.append('files', f))
        const uploadRes = await fetch(`/api/submissions/${res.id}/media`, {
          method: 'POST',
          body: uploadFd,
        })
        if (!uploadRes.ok) {
          const { error: uploadErr } = await uploadRes.json()
          setError(`Upload failed: ${uploadErr}`)
          return
        }
      }

      if (autoAnalyze && res.id) {
        setUploadStatus('Starting analysis…')
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

          {/* ── Media upload ── */}
          <div className="space-y-2">
            <label className="label">
              Screenshots / Demo Video
              <span className="text-gray-600 font-normal ml-1">(optional · used for UI/UX analysis)</span>
            </label>

            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={onDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`
                border-2 border-dashed rounded-xl px-4 py-5 text-center cursor-pointer transition-colors
                ${isDragging
                  ? 'border-purple-500 bg-purple-600/10'
                  : 'border-white/10 hover:border-white/25 hover:bg-white/[0.03]'}
              `}
            >
              <p className="text-sm text-gray-400">
                Drop files here, or <span className="text-purple-400">browse</span>
              </p>
              <p className="text-xs text-gray-600 mt-1">PNG · JPG · WebP · MP4 · WebM · up to {MAX_FILES} files</p>
              <input
                ref={fileInputRef}
                type="file"
                accept={ACCEPT}
                multiple
                className="hidden"
                onChange={(e) => addFiles(e.target.files)}
              />
            </div>

            {mediaFiles.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {mediaFiles.map((file, i) => (
                  <div key={i} className="relative group w-16 h-16">
                    {file.type.startsWith('video/') ? (
                      <div className="w-full h-full rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-lg">
                        🎬
                      </div>
                    ) : (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={URL.createObjectURL(file)}
                        alt={file.name}
                        className="w-full h-full object-cover rounded-lg border border-white/10"
                      />
                    )}
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); removeFile(i) }}
                      className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[10px] leading-none flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={autoAnalyze}
              onChange={(e) => setAutoAnalyze(e.target.checked)}
              className="w-4 h-4 rounded accent-[#3b66f5]"
            />
            <span className="text-sm text-gray-300">Auto-start AI analysis after adding</span>
          </label>

          {uploadStatus && <p className="text-xs text-purple-400">{uploadStatus}</p>}
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
