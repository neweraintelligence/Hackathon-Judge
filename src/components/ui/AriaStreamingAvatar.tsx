'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import type { SubmissionWithAnalysis, Pass6Result, JudgeScoreWithJudge } from '@/types'
import { DEFAULT_CRITERIA } from '@/lib/constants/criteria'

// ─── Avatar Judge presenter assets (Amber – black jacket, home office) ──────────────
const IDLE_VIDEO =
  'https://clips-presenters.d-id.com/v2/Amber_BlackJacket_HomeOffice/9WuHtiUDnL/Sc6QllBjEE/idle.mp4'

// ─── Speech script builders ───────────────────────────────────────────────────

function ensurePeriod(s: string): string {
  return s.trim().replace(/[.!?]?\s*$/, '.')
}

function buildSummaryScript(submission: SubmissionWithAnalysis): string {
  const pass6 = submission.ai_analyses.find(
    (a) => a.pass_name === 'pass6_synthesis'
  )?.result as Pass6Result | null

  if (!pass6) {
    return `I haven't finished my analysis of ${submission.team_name} yet. Check back when the pipeline completes.`
  }

  const sentences: string[] = []

  sentences.push(`Here's my read on ${submission.team_name}.`)

  if (pass6.most_impressive_aspect) {
    sentences.push(ensurePeriod(pass6.most_impressive_aspect))
  }

  if (pass6.judge_briefing_points?.length > 0) {
    sentences.push(`For the panel — ${ensurePeriod(pass6.judge_briefing_points[0])}`)
    if (pass6.judge_briefing_points[1]) {
      sentences.push(ensurePeriod(pass6.judge_briefing_points[1]))
    }
  }

  if (pass6.concerns_and_limitations?.length > 0) {
    sentences.push(`Worth probing: ${ensurePeriod(pass6.concerns_and_limitations[0])}`)
  }

  return sentences.join('  ')
}

function buildCriterionScript(
  criteriaKey: string,
  submission: SubmissionWithAnalysis
): string {
  const aiScore = submission.judge_scores?.find(
    (s: JudgeScoreWithJudge) =>
      s.criteria_key === criteriaKey && s.judges?.is_ai_judge
  )
  if (aiScore?.comment) return ensurePeriod(aiScore.comment)

  const pass6 = submission.ai_analyses.find(
    (a) => a.pass_name === 'pass6_synthesis'
  )?.result as Pass6Result | null
  const score = pass6?.criteria_scores?.find((s) => s.criteria_key === criteriaKey)
  if (score?.reasoning) return ensurePeriod(score.reasoning)

  return `I don't have a specific assessment for this criterion yet.`
}

// ─── Types ────────────────────────────────────────────────────────────────────

type AvatarState = 'idle' | 'connecting' | 'connected' | 'speaking' | 'error'

interface Props {
  submission: SubmissionWithAnalysis
  judgeName?: string
  onClose: () => void
}

// ─── Component ────────────────────────────────────────────────────────────────

export function AriaStreamingAvatar({ submission, judgeName = 'Avatar Judge', onClose }: Props) {
  const [state, setState] = useState<AvatarState>('idle')
  const [caption, setCaption] = useState<string>('')
  const [activeWordIdx, setActiveWordIdx] = useState<number>(-1)
  const [errorMsg, setErrorMsg] = useState<string>('')
  const [streamReady, setStreamReady] = useState(false)

  const videoRef = useRef<HTMLVideoElement>(null)
  const streamIdRef = useRef<string>('')
  const sessionIdRef = useRef<string>('')
  const pcRef = useRef<RTCPeerConnection | null>(null)
  const speakTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const wordTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const wordStartDelayRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const speakGenRef = useRef(0)
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const D_ID_START_DELAY_MS = 500
  const RETRY_INTERVAL_MS = 1500
  const MAX_RETRIES = 12

  const clearTimers = useCallback(() => {
    if (speakTimerRef.current) clearTimeout(speakTimerRef.current)
    if (wordTimerRef.current) clearInterval(wordTimerRef.current)
    if (wordStartDelayRef.current) clearTimeout(wordStartDelayRef.current)
    if (retryTimerRef.current) clearTimeout(retryTimerRef.current)
  }, [])

  // ── Speak a piece of text (retries on 400 while D-ID finishes previous) ──
  const speak = useCallback(async (text: string) => {
    if (state === 'connecting') return
    if (!streamIdRef.current || !sessionIdRef.current) return

    const gen = ++speakGenRef.current
    clearTimers()
    setState('speaking')
    setCaption(text)
    setActiveWordIdx(-1)

    let attempts = 0

    const trySend = async () => {
      if (gen !== speakGenRef.current) return

      const res = await fetch('/api/avatar/speak', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stream_id: streamIdRef.current,
          session_id: sessionIdRef.current,
          text,
        }),
      })

      if (gen !== speakGenRef.current) return

      if (res.ok) {
        const ms = Math.max(4000, text.length * 55)
        const words = text.trim().split(/\s+/)
        const msPerWord = (ms / words.length) * 0.92 // 8% faster to stay in sync

        wordStartDelayRef.current = setTimeout(() => {
          if (gen !== speakGenRef.current) return
          setActiveWordIdx(0)
          wordTimerRef.current = setInterval(() => {
            setActiveWordIdx((i) => {
              if (i >= words.length - 1) {
                clearInterval(wordTimerRef.current!)
                return i
              }
              return i + 1
            })
          }, msPerWord)
        }, D_ID_START_DELAY_MS)

        speakTimerRef.current = setTimeout(() => {
          if (gen !== speakGenRef.current) return
          setState('connected')
          setCaption('')
          setActiveWordIdx(-1)
          if (wordTimerRef.current) clearInterval(wordTimerRef.current)
        }, ms + D_ID_START_DELAY_MS)
      } else if (res.status === 400 && ++attempts < MAX_RETRIES) {
        retryTimerRef.current = setTimeout(trySend, RETRY_INTERVAL_MS)
      } else {
        setState('connected')
        setCaption('')
      }
    }

    await trySend()
  }, [state, clearTimers])

  // ── Connect WebRTC stream ──────────────────────────────────────────────────
  const connect = useCallback(async () => {
    setState('connecting')
    setErrorMsg('')

    try {
      const startRes = await fetch('/api/avatar/start', { method: 'POST' })
      if (!startRes.ok) {
        const err = await startRes.json()
        throw new Error(err?.description || err?.message || 'Failed to start avatar stream')
      }
      const { id, session_id, offer, ice_servers } = await startRes.json()

      streamIdRef.current = id
      sessionIdRef.current = session_id

      const pc = new RTCPeerConnection({ iceServers: ice_servers ?? [] })
      pcRef.current = pc

      pc.ontrack = (event) => {
        if (videoRef.current && event.streams[0]) {
          videoRef.current.srcObject = event.streams[0]
          setStreamReady(true)
        }
      }

      await pc.setRemoteDescription(new RTCSessionDescription(offer))

      pc.onicecandidate = async ({ candidate }) => {
        if (!candidate) return
        await fetch('/api/avatar/ice', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ stream_id: id, session_id, candidate }),
        })
      }

      const answer = await pc.createAnswer()
      await pc.setLocalDescription(answer)

      await fetch('/api/avatar/sdp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stream_id: id, session_id, answer }),
      })

      pc.onconnectionstatechange = () => {
        const s = pc.connectionState
        console.log('[Avatar] connection state:', s)
        if (s === 'connected') {
          setState('connected')
          speak(buildSummaryScript(submission))
        } else if (s === 'failed') {
          setState('error')
          setErrorMsg('WebRTC connection failed. Check your network or try again.')
        } else if (s === 'disconnected') {
          setState('error')
          setErrorMsg('Stream disconnected. Please try again.')
        }
      }

      pc.onicecandidateerror = (e) => {
        console.warn('[Avatar] ICE candidate error', e)
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error'
      setState('error')
      setErrorMsg(msg)
    }
  }, [submission])

  // ── Close stream ───────────────────────────────────────────────────────────
  const close = useCallback(async () => {
    clearTimers()
    if (streamIdRef.current && sessionIdRef.current) {
      await fetch('/api/avatar/close', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stream_id: streamIdRef.current,
          session_id: sessionIdRef.current,
        }),
      }).catch(() => {})
    }
    pcRef.current?.close()
    onClose()
  }, [onClose, clearTimers])

  // ── Connect on mount ───────────────────────────────────────────────────────
  useEffect(() => {
    connect()
    return () => {
      clearTimers()
      pcRef.current?.close()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Escape key closes ──────────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [close])

  const isConnected = state === 'connected' || state === 'speaking'

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#0a0b0d]">
      {/* ── Top bar ──────────────────────────────────────────────────────── */}
      <div className="shrink-0 flex items-center justify-between px-8 py-5">
        <div className="flex items-center gap-3">
          <div className="h-2 w-2 rounded-full bg-purple-500 animate-pulse" />
          <span className="text-xs font-medium text-purple-300 tracking-widest uppercase">
            {judgeName} · AI Judge
          </span>
          <span className="text-xs text-gray-600 border border-white/10 px-2 py-0.5 rounded-full">D-ID</span>
        </div>
        <button
          onClick={close}
          className="text-gray-500 hover:text-white transition-colors text-sm font-medium"
        >
          Close · Esc
        </button>
      </div>

      {/* ── Main content — side-by-side: avatar left, transcript right ─── */}
      <div className="flex-1 flex items-center justify-center px-8 min-h-0 gap-10">
        {/* Avatar column */}
        <div className="shrink-0 flex flex-col items-center gap-4">
          <div className="relative" style={{ width: 320, height: '60vh', maxHeight: 520 }}>
            <div className="absolute inset-0 -m-4 rounded-3xl bg-purple-600/10 blur-2xl pointer-events-none" />

            {/* Idle video – shown while WebRTC connecting */}
            <video
              src={IDLE_VIDEO}
              autoPlay
              loop
              muted
              playsInline
              className={`w-full h-full rounded-2xl object-cover shadow-2xl transition-opacity duration-500 ${streamReady ? 'hidden' : 'opacity-100'}`}
            />

            {/* WebRTC stream – shown once track arrives */}
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className={`w-full h-full rounded-2xl object-cover shadow-2xl transition-opacity duration-500 ${streamReady ? 'opacity-100' : 'hidden'}`}
            />

            {state === 'connecting' && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-2xl">
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

      {/* ── Control row ──────────────────────────────────────────────────── */}
      <div className="shrink-0 px-8 py-6">
        {isConnected && (
          <div className="flex flex-wrap items-center justify-center gap-2 max-w-4xl mx-auto">
            <button
              onClick={() => speak(buildSummaryScript(submission))}
              className="px-4 py-2 rounded-xl text-sm font-medium bg-purple-600/80 hover:bg-purple-600 text-white transition-all"
            >
              Full Summary
            </button>
            {DEFAULT_CRITERIA.map((c) => (
              <button
                key={c.key}
                onClick={() => speak(buildCriterionScript(c.key, submission))}
                className="px-3 py-2 rounded-xl text-xs font-medium bg-white/8 hover:bg-white/14 text-gray-300 hover:text-white transition-all"
              >
                {c.label}
              </button>
            ))}
          </div>
        )}
        <div className="mt-4 text-center text-xs text-gray-600">
          {state === 'connecting' && 'Establishing secure stream…'}
          {state === 'connected' && 'Ready · Select a topic above'}
          {state === 'speaking' && 'Speaking…'}
          {state === 'error' && 'Stream error'}
        </div>
      </div>
    </div>
  )
}