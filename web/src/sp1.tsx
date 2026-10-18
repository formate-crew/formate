// SP-1: 파일 고르기, <video playsinline> 재생(숨긴 상태 포함), 배속과 음정 유지, Wake Lock, 재생 중 화면 꺼짐, 길이(duration) 차이.
import { useEffect, useRef, useState } from 'react'
import type { CSSProperties, ChangeEvent } from 'react'
import { log } from './log'

type Mode = 'visible' | 'none' | 'hidden' | 'tiny'
const MODES: [Mode, string][] = [
  ['visible', '보이기'],
  ['none', 'display:none'],
  ['hidden', 'visibility:hidden'],
  ['tiny', '1px 투명'],
]
const MODE_STYLE: Record<Mode, CSSProperties> = {
  visible: { width: '100%', maxHeight: 240, background: '#000' },
  none: { display: 'none' },
  hidden: { visibility: 'hidden', width: 160, height: 90 },
  tiny: { position: 'fixed', left: 0, bottom: 0, width: 1, height: 1, opacity: 0.01 },
}

function setPitch(v: HTMLVideoElement, on: boolean) {
  v.preservesPitch = on
  ;(v as HTMLVideoElement & { webkitPreservesPitch?: boolean }).webkitPreservesPitch = on
}

export default function Sp1() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const urlRef = useRef<string | null>(null)
  const nameRef = useRef('')
  const lockRef = useRef<WakeLockSentinel | null>(null)
  const [mode, setMode] = useState<Mode>('visible')
  const [pitch, setPitchState] = useState(true)
  const [elapsed, setElapsed] = useState(0)
  const [durations, setDurations] = useState<{ name: string; ms: number }[]>([])

  const requestLock = async () => {
    if (!('wakeLock' in navigator)) {
      log('Wake Lock 없음')
      return
    }
    try {
      const s = await navigator.wakeLock.request('screen')
      lockRef.current = s
      log('Wake Lock 획득')
      s.addEventListener('release', () => log('Wake Lock 해제됨'))
    } catch (e) {
      log(`Wake Lock 거부: ${String(e)}`)
    }
  }

  useEffect(() => {
    const v = videoRef.current!
    const on = (type: string, fn: () => void) => {
      v.addEventListener(type, fn)
      return () => v.removeEventListener(type, fn)
    }
    const offs = [
      on('loadedmetadata', () => {
        const ms = Number.isFinite(v.duration) ? Math.round(v.duration * 1000) : Number.NaN
        log(`길이 ${ms}ms, 영상 ${v.videoWidth}×${v.videoHeight}`)
        setDurations((d) => [...d, { name: nameRef.current, ms }])
      }),
      on('play', () => {
        log(`play (rate ${v.playbackRate})`)
        void requestLock()
      }),
      on('playing', () => log('playing')),
      on('pause', () => {
        log(`pause @${Math.round(v.currentTime * 1000)}ms`)
        void lockRef.current?.release()
      }),
      on('ended', () => log('ended')),
      on('waiting', () => log('waiting(버퍼링)')),
      on('ratechange', () => log(`ratechange → ${v.playbackRate}`)),
      on('error', () => log(`video error code=${v.error?.code} ${v.error?.message ?? ''}`)),
    ]
    const onVis = () => {
      log(`visibility → ${document.visibilityState}`)
      if (document.visibilityState === 'visible' && !v.paused) void requestLock()
    }
    document.addEventListener('visibilitychange', onVis)
    const timer = setInterval(() => setElapsed(v.paused ? 0 : Math.round(v.currentTime)), 1000)
    return () => {
      offs.forEach((off) => off())
      document.removeEventListener('visibilitychange', onVis)
      clearInterval(timer)
    }
  }, [])

  const onFile = (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    const v = videoRef.current!
    if (urlRef.current) URL.revokeObjectURL(urlRef.current)
    urlRef.current = URL.createObjectURL(f)
    nameRef.current = f.name
    v.src = urlRef.current
    setPitch(v, pitch)
    log(`파일 선택: ${f.name} type=${f.type || '(없음)'} size=${f.size}`)
    e.target.value = ''
  }

  const setRate = (r: number) => {
    const v = videoRef.current!
    v.playbackRate = r
    setPitch(v, pitch)
  }

  const first = durations[0]?.ms
  return (
    <div>
      <p>
        <input type="file" accept="video/*,audio/*" onChange={onFile} />
      </p>
      <p>
        표시 방식:{' '}
        {MODES.map(([m, label]) => (
          <label key={m} style={{ marginRight: 8 }}>
            <input
              type="radio"
              checked={mode === m}
              onChange={() => {
                setMode(m)
                log(`표시 방식 → ${label}`)
              }}
            />
            {label}
          </label>
        ))}
      </p>
      <video ref={videoRef} playsInline style={MODE_STYLE[mode]} />
      <p>
        <button onClick={() => void videoRef.current!.play().catch((e) => log(`play 실패: ${String(e)}`))}>재생</button>{' '}
        <button onClick={() => videoRef.current!.pause()}>정지</button>{' '}
        <button onClick={() => setRate(0.5)}>0.5배</button> <button onClick={() => setRate(0.75)}>0.75배</button>{' '}
        <button onClick={() => setRate(1)}>1배</button>{' '}
        <label>
          <input
            type="checkbox"
            checked={pitch}
            onChange={(e) => {
              setPitchState(e.target.checked)
              setPitch(videoRef.current!, e.target.checked)
              log(`음정 유지 → ${e.target.checked}`)
            }}
          />
          음정 유지
        </label>
      </p>
      <p style={{ fontSize: 32 }}>재생 위치 {elapsed}초</p>
      <p>
        관찰 기록: <button onClick={() => log('관찰: 소리 들림')}>소리 들림</button>{' '}
        <button onClick={() => log('관찰: 소리 안 들림')}>소리 안 들림</button>{' '}
        <button onClick={() => log('관찰: 화면 꺼짐')}>화면이 꺼졌음</button>{' '}
        <button onClick={() => log('관찰: 음정 변함')}>음정이 변함</button>
      </p>
      <h2>불러온 파일의 길이</h2>
      <table>
        <tbody>
          {durations.map((d, i) => (
            <tr key={i}>
              <td>{d.name}</td>
              <td>{d.ms}ms</td>
              <td>{first === undefined ? '' : `차이 ${d.ms - first}ms`}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
