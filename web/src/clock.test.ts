import { describe, expect, it } from 'vitest'
import { createClock } from './clock'

describe('createClock (스펙 §7.4)', () => {
  it('정지 중에는 currentTime을 그대로 돌려준다', () => {
    const c = createClock()
    expect(c.sample(1.5, 1000, false)).toBe(1500)
    expect(c.sample(1.5, 2000, false)).toBe(1500)
    expect(c.anchors).toBe(0)
  })

  it('재생을 시작한 뒤 currentTime이 처음 바뀌기 전에는 외삽하지 않는다', () => {
    const c = createClock()
    c.sample(2, 0, false)
    expect(c.sample(2, 100, true)).toBe(2000)
    expect(c.sample(2, 200, true)).toBe(2000)
  })

  it('currentTime이 바뀌면 앵커를 잡고 그 뒤는 performance.now()로 보간한다', () => {
    const c = createClock()
    c.sample(2, 0, false)
    expect(c.sample(2.25, 300, true)).toBe(2250)
    expect(c.sample(2.25, 316, true)).toBe(2266)
    expect(c.anchors).toBe(1)
  })

  it('재앵커 때 (실제 − 예측)을 lastJumpMs에 남긴다. 첫 앵커는 null이다', () => {
    const c = createClock()
    c.sample(0, 0, false)
    c.sample(0.1, 100, true)
    expect(c.lastJumpMs).toBeNull()
    c.sample(0.35, 340, true) // 예측 100 + 240 = 340, 실제 350
    expect(c.lastJumpMs).toBeCloseTo(10)
    expect(c.anchors).toBe(2)
  })

  it('정지하면 점프 기록을 지운다', () => {
    const c = createClock()
    c.sample(0, 0, false)
    c.sample(0.1, 100, true)
    c.sample(0.35, 340, true)
    c.sample(0.35, 400, false)
    expect(c.lastJumpMs).toBeNull()
  })

  it('재생 속도를 반영한다', () => {
    const c = createClock()
    c.sample(0, 0, false)
    c.sample(1, 1000, true, 0.5)
    expect(c.sample(1, 1200, true, 0.5)).toBe(1100)
  })
})
