// SP-5a: 폰 세로 무대에서 토큰 드래그의 손맛. 토큰 크기·라벨·겹침 비켜 놓기를 바꿔 가며 오터치를 센다.
// 드래그 중에는 상태를 바꾸지 않고 DOM만 움직인다(트리아지 T-03: 손을 뗄 때 한 번만 반영).
import { useEffect, useRef, useState } from 'react'
import type { PointerEvent as RPointerEvent } from 'react'
import { log } from './log'
import { initialPos, isBackstage, snap } from './sp5-rules'
import type { Pos } from './sp5-rules'

type LabelMode = 'first2' | 'last2' | 'num'
const PRESETS = [
  { label: '16×8 · 20명', cols: 16, rows: 8, n: 20 },
  { label: '6×4 · 50명', cols: 6, rows: 4, n: 50 },
]
const PALETTE = ['#E4572E', '#17BEBB', '#C9A227', '#2E282A', '#76B041', '#7B2CBF', '#F15BB5', '#0081A7', '#9C6644', '#5C677D']
// 비슷한 이름(김서연·김서윤·김서현)을 일부러 넣어 라벨 구분을 시험한다.
const NAMES = [
  '김서연', '김서윤', '김서현', '이지우', '이지민', '박민준', '박민서', '최하은', '최하윤', '정도윤',
  '정도현', '강서준', '조예린', '윤지호', '장수아', '임채원', '한유진', '오시우', '서예준', '신지안',
  '권하린', '황민재', '안소율', '송태윤', '전가은', '홍지아', '유건우', '고나연', '문시아', '양준서',
  '손다인', '배로아', '백승현', '허윤서', '남민호', '노하진', '하은호', '곽서아', '성지유', '차은우',
  '주아린', '우도하', '구민성', '민소윤', '류하준', '나윤아', '진서우', '엄지후', '채다은', '원시현',
]

export default function Sp5Stage() {
  const [presetIdx, setPresetIdx] = useState(0)
  const { cols, rows, n, label: presetLabel } = PRESETS[presetIdx]
  const [count, setCount] = useState(n)
  const [labelMode, setLabelMode] = useState<LabelMode>('first2')
  const [defaultNames, setDefaultNames] = useState(false)
  const [nameTag, setNameTag] = useState(true)
  const [spread, setSpread] = useState(false)
  const [scale, setScale] = useState(1)
  const [pos, setPos] = useState<Record<number, Pos>>({})
  const [width, setWidth] = useState(0)
  const stageRef = useRef<HTMLDivElement>(null)
  const grab = useRef<{ i: number; dx: number; dy: number; t0: number; from: Pos } | null>(null)
  const counts = useRef({ wrong: 0, missed: 0, drags: 0 })

  useEffect(() => {
    const el = stageRef.current!
    const ro = new ResizeObserver(() => setWidth(el.clientWidth))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const choosePreset = (idx: number) => {
    setPresetIdx(idx)
    setCount(PRESETS[idx].n)
    setPos({})
    counts.current = { wrong: 0, missed: 0, drags: 0 }
    log(`프리셋 → ${PRESETS[idx].label}`)
  }

  const cell = width / 1.2 / cols
  const dia = Math.min(Math.max(cell * 0.85 * scale, 20), 44)
  const hit = dia + 12
  const at = (i: number) => pos[i] ?? initialPos(i, cols, rows, spread)
  const name = (i: number) => (defaultNames ? `댄서 ${i + 1}` : NAMES[i % NAMES.length])
  const label = (i: number) =>
    labelMode === 'num' ? String(i + 1) : labelMode === 'last2' ? name(i).slice(-2) : name(i).slice(0, 2)
  const toPct = (p: Pos) => ({ left: `${((p.x + 0.1) / 1.2) * 100}%`, top: `${((p.y + 0.1) / 1.2) * 100}%` })
  const toCoord = (e: RPointerEvent) => {
    const r = stageRef.current!.getBoundingClientRect()
    return { x: ((e.clientX - r.left) / r.width) * 1.2 - 0.1, y: ((e.clientY - r.top) / r.height) * 1.2 - 0.1 }
  }

  const down = (e: RPointerEvent<HTMLDivElement>, i: number) => {
    e.currentTarget.setPointerCapture(e.pointerId)
    const c = toCoord(e)
    const p = at(i)
    grab.current = { i, dx: c.x - p.x, dy: c.y - p.y, t0: performance.now(), from: p }
    e.currentTarget.style.zIndex = '1000'
  }
  const move = (e: RPointerEvent<HTMLDivElement>) => {
    const g = grab.current
    if (!g) return
    const c = toCoord(e)
    Object.assign(e.currentTarget.style, toPct({ x: c.x - g.dx, y: c.y - g.dy }))
  }
  const up = (e: RPointerEvent<HTMLDivElement>) => {
    const g = grab.current
    if (!g) return
    grab.current = null
    const c = toCoord(e)
    const s = { x: snap(c.x - g.dx, cols), y: snap(c.y - g.dy, rows) }
    Object.assign(e.currentTarget.style, toPct(s), { zIndex: '' })
    setPos((prev) => ({ ...prev, [g.i]: s }))
    counts.current.drags++
    const ms = Math.round(performance.now() - g.t0)
    log(`드래그 ${name(g.i)}: (${g.from.x}, ${g.from.y}) → (${s.x}, ${s.y}) ${ms}ms${isBackstage(s, cols) ? ' [백스테이지]' : ''}`)
  }
  const cancel = (e: RPointerEvent<HTMLDivElement>) => {
    const g = grab.current
    if (!g) return
    grab.current = null
    Object.assign(e.currentTarget.style, toPct(g.from), { zIndex: '' })
    log(`드래그 취소 ${name(g.i)}`)
  }
  const tally = (kind: 'wrong' | 'missed', text: string) => {
    counts.current[kind]++
    log(`${text} ${counts.current[kind]}회 / 드래그 ${counts.current.drags}회 (${presetLabel}, 배율 ${scale}, 라벨 ${labelMode})`)
  }

  return (
    <div>
      <p>
        {PRESETS.map((p, idx) => (
          <button key={p.label} onClick={() => choosePreset(idx)} disabled={idx === presetIdx}>
            {p.label}
          </button>
        ))}{' '}
        <button
          onClick={() => {
            setCount(count + 1)
            log(`댄서 추가 → ${count + 1}명`)
          }}
          disabled={count >= 50}
        >
          +댄서
        </button>{' '}
        {count}명
      </p>
      <p>
        라벨{' '}
        <select
          value={labelMode}
          onChange={(e) => {
            setLabelMode(e.target.value as LabelMode)
            log(`라벨 → ${e.target.value}`)
          }}
        >
          <option value="first2">이름 앞 2글자</option>
          <option value="last2">이름 뒤 2글자</option>
          <option value="num">번호</option>
        </select>{' '}
        <label>
          <input type="checkbox" checked={defaultNames} onChange={(e) => setDefaultNames(e.target.checked)} />
          기본 이름("댄서 N")
        </label>{' '}
        <label>
          <input type="checkbox" checked={nameTag} onChange={(e) => setNameTag(e.target.checked)} />
          아래 이름표
        </label>{' '}
        <label>
          <input
            type="checkbox"
            checked={spread}
            onChange={(e) => {
              setSpread(e.target.checked)
              setPos({})
              log(`비켜 놓기 → ${e.target.checked}`)
            }}
          />
          겹침 비켜 놓기
        </label>{' '}
        배율{' '}
        <input
          type="range"
          min={0.6}
          max={1.3}
          step={0.1}
          value={scale}
          onChange={(e) => {
            setScale(Number(e.target.value))
            log(`배율 → ${e.target.value}`)
          }}
        />{' '}
        지름 {Math.round(dia)}px
      </p>
      <div
        ref={stageRef}
        style={{
          position: 'relative',
          width: '100%',
          aspectRatio: `${cols} / ${rows}`,
          background: '#3a3a3a',
          touchAction: 'none',
          userSelect: 'none',
          WebkitUserSelect: 'none',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute',
            left: `${(0.1 / 1.2) * 100}%`,
            top: `${(0.1 / 1.2) * 100}%`,
            width: `${100 / 1.2}%`,
            height: `${100 / 1.2}%`,
            background: '#f4f1ea',
            backgroundImage:
              'linear-gradient(to right, #ccc 1px, transparent 1px), linear-gradient(to bottom, #ccc 1px, transparent 1px)',
            backgroundSize: `${100 / cols}% ${100 / rows}%`,
          }}
        >
          <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${100 / cols}%`, background: 'rgba(0,0,0,0.15)' }} />
          <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: `${100 / cols}%`, background: 'rgba(0,0,0,0.15)' }} />
          <div style={{ position: 'absolute', bottom: 2, width: '100%', textAlign: 'center', fontSize: 11, color: '#888' }}>관객석 (앞)</div>
        </div>
        {Array.from({ length: count }, (_, i) => {
          const p = at(i)
          return (
            <div
              key={i}
              onPointerDown={(e) => down(e, i)}
              onPointerMove={move}
              onPointerUp={up}
              onPointerCancel={cancel}
              style={{ position: 'absolute', ...toPct(p), width: hit, height: hit, marginLeft: -hit / 2, marginTop: -hit / 2, display: 'grid', placeItems: 'center' }}
            >
              <div
                style={{
                  width: dia,
                  height: dia,
                  borderRadius: '50%',
                  background: PALETTE[i % PALETTE.length],
                  opacity: isBackstage(p, cols) ? 0.6 : 1,
                  color: '#fff',
                  fontSize: Math.max(9, dia * 0.36),
                  fontWeight: 700,
                  display: 'grid',
                  placeItems: 'center',
                  lineHeight: 1,
                }}
              >
                {label(i)}
              </div>
              {nameTag && (
                <div style={{ position: 'absolute', top: '100%', fontSize: 10, whiteSpace: 'nowrap', color: '#111', pointerEvents: 'none' }}>
                  {name(i)}
                </div>
              )}
            </div>
          )
        })}
      </div>
      <p>
        <button onClick={() => tally('wrong', '다른 토큰이 잡힘')}>다른 토큰이 잡힘 +1</button>{' '}
        <button onClick={() => tally('missed', '안 잡힘')}>안 잡힘 +1</button>{' '}
        <button onClick={() => log(`판정: 폰 세로 편집 가능 (${presetLabel}, 배율 ${scale}, 라벨 ${labelMode})`)}>편집 가능</button>{' '}
        <button onClick={() => log(`판정: 폰 세로 편집 불가 (${presetLabel}, 배율 ${scale}, 라벨 ${labelMode})`)}>편집 불가</button>
      </p>
    </div>
  )
}
