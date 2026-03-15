'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import type { SubmissionWithAnalysis, Pass6Result, JudgeScoreWithJudge } from '@/types'
import { DEFAULT_CRITERIA } from '@/lib/constants/criteria'

// ─── Aria's presenter assets (Amber – black jacket, home office) ──────────────
const IDLE_VIDEO =
  'https://clips-presenters.d-id.com/v2/Amber_BlackJacket_HomeOffice/9WuHtiUDnL/Sc6QllBjEE/idle.mp4'

// ─── Speech script builders ───────────────────────────────────────────────────

function buildSummaryScript(submission: SubmissionWithAnalysis): string {
  const pass6 = submission.ai_analyses.find(
    (a) => a.pass_name === 'pass6_synthesis'
  )?.result as Pass6Result | null

  if (!pass6) {
    return `I haven't finished my analysis of ${submission.team_name} yet. Check back when the pipeline completes.`
  }

  const parts: string[] = [`${submission.team_name}.`]

  if (pass6.most_impressive_aspect) {
    parts.push(pass6.most_impressive_aspect)
  }

  if (pass6.judge_briefing_points?.length > 0) {
    parts.push(`For the panel: ${pass6.judge_briefing_points[0]}`)
    if (pass6.judge_briefing_points[1]) {
      parts.push(pass6.judge_briefing_points[1])
    }
  }

  if (pass6.concerns_and_limitations?.length > 0) {
    parts.push(`Worth probing: ${pass6.concerns_and_limitations[0]}`)
  }

  return parts.join(' ')
}

function buildCriterionScript(
  criteriaKey: string,
  submission: SubmissionWithAnalysis
): string {
  // Prefer Aria's voice-rewritten judge score comment
  const aiScore = submission.judge_scores?.find(
    (s: JudgeScoreWithJudge) =>
      s.criteria_key === criteriaKey && s.judges?.is_ai_judge
  )
  if (aiScore?.comment) return aiScore.comment

  // Fall back to pass6 criterion reasoning
  const pass6 = submission.ai_analyses.find(
    (a) => a.pass_name === 'pass6_synthesis'
  )?.result as Pass6Result | null
  const score = pass6?.criteria_scores?.find((s) => s.criteria_key === criteriaKey)
  if (score?.reasoning) return score.reasoning

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

export function AriaStreamingAvatar({ submission, judgeName = 'Aria', onClose }: Props) {
  const [state, setState] = useState<AvatarState>('idle')
  const [caption, setCaption] = useState<string>('')
  const [errorMsg, setErrorMsg] = useState<string>('')
  const [streamReady, setStreamReady] = useState(false)

  const videoRef = useRef<HTMLVideoElement>(null)
  const streamIdRef = useRef<string>('')
  const sessionIdRef = useRef<string>('')
  const pcRef = useRef<RTCPeerConnection | null>(null)
  const speakTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // ── Speak a piece of text ──────────────────────────────────────────────────
  const speak = useCallback(async (text: string) => {
    if (state === 'connecting') return
    if (!streamIdRef.current || !sessionIdRef.current) return

    setState('speaking')
    setCaption(text)

    await fetch('/api/avatar/speak', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        stream_id: streamIdRef.current,
        session_id: sessionIdRef.current,
        text,
      }),
    })

    // Estimate reading duration (~120 wpm = ~2 chars/sec) then reset
    if (speakTimerRef.current) clearTimeout(speakTimerRef.current)
    const ms = Math.max(4000, text.length * 55)
    speakTimerRef.current = setTimeout(() => {
      setState('connected')
      setCaption('')
    }, ms)
  }, [state])

  // ── Connect WebRTC stream ──────────────────────────────────────────────────
  const connect = useCallback(async () => {
    setState('connecting')
    setErrorMsg('')

    try {
      // 1. Start stream session (server proxies to D-ID)
      const startRes = await fetch('/api/avatar/start', { method: 'POST' })
      if (!startRes.ok) {
        const err = await startRes.json()
        throw new Error(err?.description || err?.message || 'Failed to start avatar stream')
      }
      const { id, session_id, offer, ice_servers } = await startRes.json()

      streamIdRef.current = id
      sessionIdRef.current = session_id

      // 2. Create WebRTC peer connection
      const pc = new RTCPeerConnection({ iceServers: ice_servers ?? [] })
      pcRef.current = pc

      // 3. Bind incoming video/audio track to video element
      pc.ontrack = (event) => {
        if (videoRef.current && event.streams[0]) {
          videoRef.current.srcObject = event.streams[0]
          setStreamReady(true)
        }
      }

      // 4. Set remote description from D-ID offer
      await pc.setRemoteDescription(new RTCSessionDescription(offer))

      // 5. Set up ICE candidate trickling BEFORE setLocalDescription so no
      //    candidates are missed — D-ID expects trickle ICE
      pc.onicecandidate = async ({ candidate }) => {
        if (!candidate) return
        await fetch('/api/avatar/ice', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ stream_id: id, session_id, candidate }),
        })
      }

      // 6. Create + set SDP answer (triggers ICE gathering)
      const answer = await pc.createAnswer()
      await pc.setLocalDescription(answer)

      // 7. Send the SDP answer to D-ID immediately (trickle ICE — candidates follow separately)
      await fetch('/api/avatar/sdp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stream_id: id, session_id, answer }),
      })

      // 8. Track connection state
      pc.onconnectionstatechange = () => {
        const s = pc.connectionState
        console.log('[Aria] connection state:', s)
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
        console.warn('[Aria] ICE candidate error', e)
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error'
      setState('error')
      setErrorMsg(msg)
    }
  }, [speak, submission])

  // ── Close stream ───────────────────────────────────────────────────────────
  const close = useCallback(async () => {
    if (speakTimerRef.current) clearTimeout(speakTimerRef.current)
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
  }, [onClose])

  // ── Connect on mount ───────────────────────────────────────────────────────
  useEffect(() => {
    connect()
    return () => {
      if (speakTimerRef.current) clearTimeout(speakTimerRef.current)
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
        </div>
        <button
          onClick={close}
          className="text-gray-500 hover:text-white transition-colors text-sm font-medium"
        >
          Close · Esc
        </button>
      </div>

      {/* ── Main video area ──────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 gap-6 min-h-0">
        <div className="relative w-full max-w-3xl">
          {/* Glow ring behind video */}
          <div className="absolute inset-0 -m-4 rounded-3xl bg-purple-600/10 blur-2xl pointer-events-none" />

          {/* Idle video – shown while WebRTC connecting */}
          <video
            src={IDLE_VIDEO}
            autoPlay
            loop
            muted
            playsInline
            className={`
              w-full rounded-2xl object-cover shadow-2xl transition-opacity duration-500
              ${streamReady ? 'hidden' : 'opacity-100'}
            `}
          />

          {/* WebRTC stream – shown once track arrives */}
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className={`
              w-full rounded-2xl object-cover shadow-2xl transition-opacity duration-500
              ${streamReady ? 'opacity-100' : 'hidden'}
            `}
          />

          {/* Caption overlay */}
          {caption && state === 'speaking' && (
            <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 via-black/50 to-transparent rounded-b-2xl">
              <p className="text-white text-sm leading-relaxed text-center max-w-2xl mx-auto">
                {caption}
              </p>
            </div>
          )}

          {/* Connecting overlay */}
          {state === 'connecting' && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-2xl">
              <div className="flex items-center gap-2 text-gray-300 text-sm">
                <span className="animate-spin h-4 w-4 border-2 border-purple-400 border-t-transparent rounded-full" />
                Connecting…
              </div>
            </div>
          )}

          {/* Error overlay */}
          {state === 'error' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 rounded-2xl gap-3">
              <p className="text-rose-300 text-sm text-center max-w-xs">{errorMsg || 'Connection failed.'}</p>
              <button
                onClick={connect}
                className="text-xs text-white bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg transition-colors"
              >
                Retry
              </button>
            </div>
          )}
        </div>

        {/* Name row */}
        <div className="text-center">
          <div className="text-2xl font-semibold text-white tracking-tight">{judgeName}</div>
          <div className="text-xs text-gray-500 mt-1">{submission.team_name}</div>
        </div>
      </div>

      {/* ── Control row ──────────────────────────────────────────────────── */}
      <div className="shrink-0 px-8 py-6">
        {isConnected && (
          <div className="flex flex-wrap items-center justify-center gap-2 max-w-4xl mx-auto">
            {/* Summary button */}
            <button
              onClick={() => speak(buildSummaryScript(submission))}
              disabled={state === 'speaking'}
              className="px-4 py-2 rounded-xl text-sm font-medium bg-purple-600/80 hover:bg-purple-600 disabled:opacity-40 text-white transition-all"
            >
              Full Summary
            </button>

            {/* Per-criterion buttons */}
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

        {/* Status line */}
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
