// SP-5b: 타임라인에서 "탐색(좌우로 밀기)"과 "블록 드래그"를 어떻게 가를지 세 방식을 비교한다(스펙 §4.3).
// 그리고 상한 문서의 A1 기기 저장소 쓰기 시간을 잰다(트리아지 T-11).
import { Fragment, useRef, useState } from 'react'
import type { PointerEvent as RPointerEvent } from 'react'
import { log } from './log'
import { makeMaxDoc } from './maxdoc'

type F = { start: number; tr: number }
type Scheme = 'longpress' | 'select' | 'grip'
type Gesture = { kind: 'pending' | 'scrub' | 'block'; block: number | null; x0: number; y0: number; t0: number; start0: number; timer: number; moved: boolean }

const SCHEMES: [Scheme, string][] = [
  ['longpress', 'A. 길게 누르면 블록, 그냥 밀면 탐색'],
  ['select', 'B. 탭해서 고른 블록만 드래그'],
  ['grip', 'C. 블록 아래 손잡이만 드래그'],
]
const INIT: F[] = Array.from({ length: 12 }, (_, i) => ({ start: i * 4000, tr: i === 0 ? 0 : 1000 }))
const PX_PER_MS = 0.06

/** §7.3 블록 드래그: 100ms 스냅(템포 없음) 뒤 겹침·순서 경계에서 클램프. 첫 대형은 움직이지 않는다. */
function moveBlock(fs: F[], i: number, raw: number): F[] {
  if (i === 0) return fs
  const prev = fs[i - 1]
  const cur = fs[i]
  const next = fs[i + 1]
  const lo = prev.start + Math.max(cur.tr, 1)
  const hi = next ? Math.min(next.start - next.tr, next.start - 1) : 1_800_000
  const start = Math.min(Math.max(Math.round(raw / 100) * 100, lo), hi)
  return fs.map((f, k) => (k === i ? { ...f, start } : f))
}

const fmt = (ms: number) => `${Math.floor(ms / 60000)}:${String(Math.floor((ms % 60000) / 1000)).padStart(2, '0')}.${Math.floor((ms % 1000) / 100)}`

export default function Sp5Timeline() {
  const [scheme, setScheme] = useState<Scheme>('longpress')
  const [fs, setFs] = useState<F[]>(INIT)
  const [t, setT] = useState(0)
  const [selected, setSelected] = useState<number | null>(null)
  const [dragging, setDragging] = useState<number | null>(null)
  const g = useRef<Gesture | null>(null)
  const latest = useRef({ fs, t })
  latest.current = { fs, t }
  const wrong = useRef(0)
  const end = fs[fs.length - 1].start + 4000

  const down = (e: RPointerEvent<HTMLDivElement>) => {
    const el = e.target as HTMLElement
    const attr = el.closest('[data-block]')?.getAttribute('data-block')
    const block = attr == null ? null : Number(attr)
    const onGrip = el.closest('[data-grip]') !== null
    e.currentTarget.setPointerCapture(e.pointerId)
    const gs: Gesture = { kind: 'pending', block, x0: e.clientX, y0: e.clientY, t0: t, start0: block == null ? 0 : fs[block].start, timer: 0, moved: false }
    if (block == null || block === 0) gs.kind = 'scrub'
    else if (scheme === 'grip') gs.kind = onGrip ? 'block' : 'scrub'
    else if (scheme === 'select') gs.kind = selected === block ? 'block' : 'pending'
    else
      gs.timer = window.setTimeout(() => {
        if (g.current === gs && !gs.moved) {
          gs.kind = 'block'
          setDragging(block)
          log(`길게 누름 → 대형 ${block + 1} 잡음`)
        }
      }, 300)
    g.current = gs
    if (gs.kind === 'block') setDragging(block)
  }

  const move = (e: RPointerEvent<HTMLDivElement>) => {
    const gs = g.current
    if (!gs) return
    const dx = e.clientX - gs.x0
    if (Math.abs(dx) > 8 || Math.abs(e.clientY - gs.y0) > 8) gs.moved = true
    if (gs.kind === 'pending' && gs.moved) {
      gs.kind = 'scrub'
      clearTimeout(gs.timer)
    }
    if (gs.kind === 'scrub') setT(Math.min(Math.max(gs.t0 - dx / PX_PER_MS, 0), end))
    if (gs.kind === 'block' && gs.block != null) {
      const b = gs.block
      setFs((prev) => moveBlock(prev, b, gs.start0 + dx / PX_PER_MS))
    }
  }

  const up = () => {
    const gs = g.current
    g.current = null
    if (!gs) return
    clearTimeout(gs.timer)
    const { fs: nowFs, t: nowT } = latest.current
    if (gs.kind === 'pending' && !gs.moved && gs.block != null) {
      if (scheme === 'select') {
        setSelected(gs.block)
        log(`[${scheme}] 대형 ${gs.block + 1} 선택`)
      } else log(`[${scheme}] 탭(동작 없음)`)
    } else if (gs.kind === 'scrub') log(`[${scheme}] 탐색 → ${fmt(nowT)}`)
    else if (gs.kind === 'block' && gs.block != null) log(`[${scheme}] 대형 ${gs.block + 1}: ${gs.start0} → ${nowFs[gs.block].start}ms`)
    setDragging(null)
  }

  const measureStorage = () => {
    const doc = makeMaxDoc()
    for (const [label, lastSent] of [['lastSent 없음', null], ['lastSent = 같은 문서', doc]] as const) {
      const times: number[] = []
      let chars = 0
      try {
        for (let k = 0; k < 5; k++) {
          const t0 = performance.now()
          const s = JSON.stringify({ baseRevision: 1234, content: doc, lastSent })
          localStorage.setItem('kickoff:pending:spike:max', s)
          times.push(performance.now() - t0)
          chars = s.length
        }
        times.sort((a, b) => a - b)
        log(`A1 쓰기(${label}): ${(chars / 1000).toFixed(0)}k자, stringify+setItem 중앙값 ${times[2].toFixed(1)}ms 최대 ${times[4].toFixed(1)}ms`)
      } catch (e) {
        log(`A1 쓰기(${label}) 실패: ${String(e)}`)
      } finally {
        localStorage.removeItem('kickoff:pending:spike:max')
      }
    }
  }

  return (
    <div>
      <p>
        {SCHEMES.map(([s, label]) => (
          <label key={s} style={{ display: 'block' }}>
            <input
              type="radio"
              checked={scheme === s}
              onChange={() => {
                setScheme(s)
                setSelected(null)
                wrong.current = 0
                log(`방식 → ${label}`)
              }}
            />
            {label}
          </label>
        ))}
      </p>
      <p style={{ fontSize: 24 }}>플레이헤드 {fmt(t)}</p>
      <div
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={up}
        onPointerCancel={up}
        style={{ position: 'relative', height: 96, overflow: 'hidden', background: '#222', touchAction: 'none', userSelect: 'none', WebkitUserSelect: 'none' }}
      >
        <div style={{ position: 'absolute', left: '50%', top: 0, bottom: 0, width: 2, background: 'red', zIndex: 10, pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: 8, bottom: 8, left: `calc(50% - ${t * PX_PER_MS}px)` }}>
          {fs.map((f, i) => {
            const until = fs[i + 1] ? fs[i + 1].start - fs[i + 1].tr : end
            return (
              <Fragment key={i}>
                {f.tr > 0 && (
                  <div style={{ position: 'absolute', left: (f.start - f.tr) * PX_PER_MS, width: f.tr * PX_PER_MS, top: 24, bottom: 24, background: '#557' }} />
                )}
                <div
                  data-block={i}
                  style={{
                    position: 'absolute',
                    left: f.start * PX_PER_MS,
                    width: Math.max(8, (until - f.start) * PX_PER_MS - 2),
                    top: 0,
                    bottom: 0,
                    background: i === dragging ? '#f90' : i === selected ? '#fc6' : '#48c',
                    color: '#fff',
                    borderRadius: 6,
                    fontSize: 12,
                    padding: 4,
                    boxSizing: 'border-box',
                  }}
                >
                  대형 {i + 1}
                  {scheme === 'grip' && i > 0 && (
                    <div data-grip style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: '45%', background: 'rgba(0,0,0,.3)', textAlign: 'center' }}>
                      ⇔
                    </div>
                  )}
                </div>
              </Fragment>
            )
          })}
        </div>
      </div>
      <p>
        <button
          onClick={() => {
            wrong.current++
            log(`[${scheme}] 의도와 다르게 움직임 ${wrong.current}회`)
          }}
        >
          의도와 다르게 움직임 +1
        </button>{' '}
        <button
          onClick={() => {
            setFs(INIT)
            setT(0)
            log('타임라인 초기화')
          }}
        >
          초기화
        </button>
      </p>
      <h2>저장 시간 (저가 안드로이드에서)</h2>
      <button onClick={measureStorage}>상한 문서 A1 쓰기 시간 재기</button>
    </div>
  )
}
