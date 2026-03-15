'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import StreamingAvatar, {
  AvatarQuality,
  StreamingEvents,
  TaskType,
} from '@heygen/streaming-avatar'
import type { SubmissionWithAnalysis } from '@/types'
import { DEFAULT_CRITERIA } from '@/lib/constants/criteria'
import { buildSummaryScript, buildCriterionScript } from '@/lib/aria-scripts'

// Streaming-compatible Interactive Avatar (Katya Professional Look)
const AVATAR_ID = 'Alessandra_ProfessionalLook_public'

type AvatarState = 'idle' | 'connecting' | 'connected' | 'speaking' | 'error'

interface Props {
  submission: SubmissionWithAnalysis
  judgeName?: string
  onClose: () => void
}

export function HeyGenAriaAvatar({ submission, judgeName = 'Aria', onClose }: Props) {
  const [state, setState] = useState<AvatarState>('idle')
  const [caption, setCaption] = useState('')
  const [activeWordIdx, setActiveWordIdx] = useState<number>(-1)
  const [errorMsg, setErrorMsg] = useState('')

  const videoRef = useRef<HTMLVideoElement>(null)
  const avatarRef = useRef<StreamingAvatar | null>(null)
  const wordTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // ── Speak ──────────────────────────────────────────────────────────────────
  const speak = useCallback(async (text: string) => {
    if (!avatarRef.current || state === 'connecting') return
    setState('speaking')
    setCaption(text)
    setActiveWordIdx(0)
    if (wordTimerRef.current) clearInterval(wordTimerRef.current)
    const words = text.trim().split(/\s+/)
    const ms = Math.max(4000, text.length * 55)
    const msPerWord = ms / words.length
    wordTimerRef.current = setInterval(() => {
      setActiveWordIdx((i) => {
        if (i >= words.length - 1) { clearInterval(wordTimerRef.current!); return i }
        return i + 1
      })
    }, msPerWord)
    try {
      await avatarRef.current.speak({ text, task_type: TaskType.REPEAT })
    } catch (err) {
      console.error('[HeyGen] speak error', err)
      setState('connected')
      setCaption('')
      setActiveWordIdx(-1)
      if (wordTimerRef.current) clearInterval(wordTimerRef.current)
    }
  }, [state])

  // ── Connect ────────────────────────────────────────────────────────────────
  const connect = useCallback(async () => {
    setState('connecting')
    setErrorMsg('')
    try {
      // Get session token from our server proxy
      const res = await fetch('/api/avatar/heygen/token', { method: 'POST' })
      if (!res.ok) throw new Error('Failed to get HeyGen session token')
      const { token } = await res.json()

      const avatar = new StreamingAvatar({ token })
      avatarRef.current = avatar

      // Stream ready → bind to video element
      avatar.on(StreamingEvents.STREAM_READY, (event: any) => {
        if (videoRef.current && event.detail) {
          videoRef.current.srcObject = event.detail
          videoRef.current.play().catch(() => {})
        }
        setState('connected')
        // Auto-speak summary on connect
        speak(buildSummaryScript(submission))
      })

      avatar.on(StreamingEvents.AVATAR_START_TALKING, () => {
        setState('speaking')
      })

      avatar.on(StreamingEvents.AVATAR_STOP_TALKING, () => {
        setState('connected')
        setCaption('')
        setActiveWordIdx(-1)
        if (wordTimerRef.current) clearInterval(wordTimerRef.current)
      })

      avatar.on(StreamingEvents.STREAM_DISCONNECTED, () => {
        setState('error')
        setErrorMsg('Stream disconnected. Please try again.')
      })

      await avatar.createStartAvatar({
        quality: AvatarQuality.High,
        avatarName: AVATAR_ID,
        language: 'en',
      })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error'
      setState('error')
      setErrorMsg(msg)
    }
  }, [speak, submission])

  // ── Close ──────────────────────────────────────────────────────────────────
  const close = useCallback(async () => {
    try {
      await avatarRef.current?.stopAvatar()
    } catch {}
    onClose()
  }, [onClose])

  // ── Lifecycle ──────────────────────────────────────────────────────────────
  useEffect(() => {
    connect()
    return () => {
      avatarRef.current?.stopAvatar().catch(() => {})
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') close() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [close])

  const isConnected = state === 'connected' || state === 'speaking'

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#0a0b0d]">
      {/* Top bar */}
      <div className="shrink-0 flex items-center justify-between px-8 py-5">
        <div className="flex items-center gap-3">
          <div className="h-2 w-2 rounded-full bg-purple-500 animate-pulse" />
          <span className="text-xs font-medium text-purple-300 tracking-widest uppercase">
            {judgeName} · AI Judge
          </span>
          <span className="text-xs text-gray-600 border border-white/10 px-2 py-0.5 rounded-full">HeyGen</span>
        </div>
        <button onClick={close} className="text-gray-500 hover:text-white transition-colors text-sm font-medium">
          Close · Esc
        </button>
      </div>

      {/* Main content — side-by-side: avatar left, transcript right */}
      <div className="flex-1 flex items-center justify-center px-8 min-h-0 gap-10">
        {/* Avatar column */}
        <div className="shrink-0 flex flex-col items-center gap-4">
          <div className="relative" style={{ width: 320, height: '60vh', maxHeight: 520 }}>
            <div className="absolute inset-0 -m-4 rounded-3xl bg-purple-600/10 blur-2xl pointer-events-none" />

            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="w-full h-full rounded-2xl object-contain shadow-2xl bg-[#0a0b0d]"
            />

            {state === 'connecting' && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-2xl">
                <div className="flex items-center gap-2 text-gray-300 text-sm">
                  <span className="animate-spin h-4 w-4 border-2 border-purple-400 border-t-transparent rounded-full" />
                  Connecting…
                </div>
              </div>
            )}

            {state === 'error' && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 rounded-2xl gap-3">
                <p className="text-rose-300 text-sm text-center max-w-xs">{errorMsg || 'Connection failed.'}</p>
                <button onClick={connect} className="text-xs text-white bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg transition-colors">
                  Retry
                </button>
              </div>
            )}
          </div>

          <div className="text-center">
            <div className="text-2xl font-semibold text-white tracking-tight">{judgeName}</div>
            <div className="text-xs text-gray-500 mt-1">{submission.team_name}</div>
          </div>
        </div>

        {/* Transcript column */}
        {caption && state === 'speaking' && (() => {
          const words = caption.trim().split(/\s+/)
          return (
            <div className="flex-1 max-w-md self-stretch flex flex-col justify-center min-h-0">
              <div className="overflow-y-auto max-h-[60vh] rounded-2xl border border-white/10 bg-white/[0.03] px-6 py-5">
                <div className="text-[10px] font-medium text-purple-400 uppercase tracking-widest mb-3">Transcript</div>
                <p className="text-gray-200 text-sm leading-relaxed">
                  {words.map((word, wi) => (
                    <span
                      key={wi}
                      className={wi === activeWordIdx
                        ? 'text-purple-300 drop-shadow-[0_0_6px_rgba(167,139,250,0.8)] transition-colors duration-100'
                        : 'transition-colors duration-100'
                      }
                    >
                      {word}{wi < words.length - 1 ? ' ' : ''}
                    </span>
                  ))}
                </p>
              </div>
            </div>
          )
        })()}
      </div>

      {/* Controls */}
      <div className="shrink-0 px-8 py-6">
        {isConnected && (
          <div className="flex flex-wrap items-center justify-center gap-2 max-w-4xl mx-auto">
            <button
              onClick={() => speak(buildSummaryScript(submission))}
              disabled={state === 'speaking'}
              className="px-4 py-2 rounded-xl text-sm font-medium bg-purple-600/80 hover:bg-purple-600 disabled:opacity-40 text-white transition-all"
            >
              Full Summary
            </button>
            {DEFAULT_CRITERIA.map((c) => (
              <button
                key={c.key}
                onClick={() => speak(buildCriterionScript(c.key, submission))}
                disabled={state === 'speaking'}
                className="px-3 py-2 rounded-xl text-xs font-medium bg-white/8 hover:bg-white/14 disabled:opacity-40 text-gray-300 hover:text-white transition-all"
              >
                {c.label}
              </button>
            ))}
          </div>
        )}
        <div className="mt-4 text-center text-xs text-gray-600">
          {state === 'connecting' && 'Establishing HeyGen stream…'}
          {state === 'connected' && 'Ready · Select a topic above'}
          {state === 'speaking' && 'Speaking…'}
          {state === 'error' && 'Stream error'}
        </div>
      </div>
    </div>
  )
}
