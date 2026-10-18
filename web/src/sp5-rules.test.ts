import { describe, expect, it } from 'vitest'
import { initialPos, isBackstage, snap } from './sp5-rules'

describe('snap (§7.3)', () => {
  it('rows=8에서 1.1 근처는 범위 안의 마지막 교차점(1.0625)에 붙는다', () => {
    expect(snap(1.2, 8)).toBe(1.0625)
    expect(snap(1.09, 8)).toBe(1.0625)
  })
  it('−0.1보다 바깥은 범위 안의 첫 교차점에 붙는다', () => {
    const v = snap(-0.5, 16)
    expect(v).toBeGreaterThanOrEqual(-0.1)
    expect(v).toBeLessThan(-0.09)
  })
  it('안쪽 값은 가장 가까운 0.5칸 교차점에 붙는다', () => {
    expect(snap(0.51, 16)).toBe(0.5)
    expect(snap(0.52, 16)).toBe(0.5313)
  })
})

describe('isBackstage (트리아지 T-03)', () => {
  it('cols=21 경계선 위(반올림한 1/21)는 무대다', () => {
    expect(isBackstage({ x: Math.round((1 / 21) * 1e4) / 1e4, y: 0.5 }, 21)).toBe(false)
    expect(isBackstage({ x: Math.round((1 - 1 / 21) * 1e4) / 1e4, y: 0.5 }, 21)).toBe(false)
  })
  it('끝 열 안과 0~1 밖은 백스테이지다', () => {
    expect(isBackstage({ x: 0.5 / 21, y: 0.5 }, 21)).toBe(true)
    expect(isBackstage({ x: 0.5, y: 1.05 }, 21)).toBe(true)
  })
})

describe('initialPos 비켜 놓기 (트리아지 §2)', () => {
  it('모든 격자 × 50명에서 좌표가 겹치지 않고, −0.1~1.1 안이며, 백스테이지다', () => {
    for (let cols = 6; cols <= 24; cols++) {
      for (let rows = 4; rows <= 16; rows++) {
        const seen = new Set<string>()
        for (let i = 0; i < 50; i++) {
          const p = initialPos(i, cols, rows, true)
          expect(p.x).toBeGreaterThanOrEqual(-0.1)
          expect(p.x).toBeLessThanOrEqual(1.1)
          expect(isBackstage(p, cols)).toBe(true)
          seen.add(`${p.x},${p.y}`)
        }
        expect(seen.size).toBe(50)
      }
    }
  })
  it('비켜 놓지 않으면 2·rows명마다 같은 자리에 겹친다(현행 스펙)', () => {
    expect(initialPos(16, 16, 8, false)).toEqual(initialPos(0, 16, 8, false))
  })
})
