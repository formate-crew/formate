// SP-3: 싱크 측정. 앱 시계(스펙 §7.4 보간)가 박에 닿을 때마다 화면을 흰색으로 칠한다.
// 테스트 파일의 비프(1.000초부터 0.5초마다)와 흰 화면을 다른 폰으로 60fps 녹화해 어긋남을 잰다.
import { useEffect, useRef } from 'react'
import type { ChangeEvent } from 'react'
import { createClock } from './clock'
import { log } from './log'

const FIRST_BEAT_MS = 1000
const BEAT_MS = 500
const FLASH_MS = 60

export default function Sp3() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const flashRef = useRef<HTMLDivElement>(null)
  const readoutRef = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const v = videoRef.current!
    const clock = createClock()
    let raf = 0
    let seen = 0
    let windowStart = performance.now()
    let winAnchors = 0
    let winAbsSum = 0
    let winJumps = 0
    let winMax = 0
    let lock: WakeLockSentinel | null = null

    const onPlay = async () => {
      log(`play @${Math.round(v.currentTime * 1000)}ms`)
      try {
        lock = (await navigator.wakeLock?.request('screen')) ?? null
      } catch (e) {
        log(`Wake Lock 거부: ${String(e)}`)
      }
    }
    const onPause = () => {
      log(`pause @${Math.round(v.currentTime * 1000)}ms`)
      void lock?.release()
    }
    const onSeeked = () => log(`탐색 완료 → ${Math.round(v.currentTime * 1000)}ms`)
    v.addEventListener('play', onPlay)
    v.addEventListener('pause', onPause)
    v.addEventListener('seeked', onSeeked)

    const tick = (now: number) => {
      const playing = !v.paused && !v.ended && v.readyState >= 2
      const t = clock.sample(v.currentTime, now, playing, v.playbackRate)
      if (clock.anchors !== seen) {
        seen = clock.anchors
        winAnchors++
        if (clock.lastJumpMs !== null && !v.seeking) {
          winJumps++
          winAbsSum += Math.abs(clock.lastJumpMs)
          winMax = Math.max(winMax, Math.abs(clock.lastJumpMs))
        }
      }
      const since = t - FIRST_BEAT_MS
      const white = playing && since >= 0 && since % BEAT_MS < FLASH_MS
      flashRef.current!.style.background = white ? '#fff' : '#000'
      readoutRef.current!.textContent = `${Math.round(t)}ms`
      if (now - windowStart >= 10000) {
        if (playing) {
          const avg = winJumps ? (winAbsSum / winJumps).toFixed(1) : '-'
          log(`10초 통계 @${Math.round(t)}ms: 앵커 ${(winAnchors / 10).toFixed(1)}회/초, 재앵커 점프 평균 ${avg}ms 최대 ${winMax.toFixed(1)}ms`)
        }
        windowStart = now
        winAnchors = winAbsSum = winJumps = winMax = 0
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => {
      cancelAnimationFrame(raf)
      v.removeEventListener('play', onPlay)
      v.removeEventListener('pause', onPause)
      v.removeEventListener('seeked', onSeeked)
      void lock?.release()
    }
  }, [])

  const onFile = (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    videoRef.current!.src = URL.createObjectURL(f)
    log(`파일: ${f.name}`)
  }
  const seekTo = (ms: number) => {
    videoRef.current!.currentTime = ms / 1000
    log(`탐색 요청 → ${ms}ms`)
  }

  return (
    <div>
      <p>
        <input type="file" accept="video/*,audio/*" onChange={onFile} /> 기기 자동 잠금은 "안 함", 밝기는 최대로 둔다.
      </p>
      <p>
        <button onClick={() => void videoRef.current!.play().catch((e) => log(`play 실패: ${String(e)}`))}>재생</button>{' '}
        <button onClick={() => videoRef.current!.pause()}>정지</button>{' '}
        <button onClick={() => seekTo(0)}>처음으로</button> <button onClick={() => seekTo(90000)}>90초로 탐색</button>{' '}
        앱 시계 <span ref={readoutRef}>0ms</span>
      </p>
      <div ref={flashRef} style={{ width: '100%', height: '55vh', background: '#000' }} />
      <video ref={videoRef} playsInline style={{ width: 120, marginTop: 8 }} />
    </div>
  )
}
