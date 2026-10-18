import { describe, expect, it } from 'vitest'
import { makeMaxDoc } from './maxdoc'

describe('makeMaxDoc (§5.3 상한, 트리아지 T-03)', () => {
  const doc = makeMaxDoc()
  it('상한을 꽉 채우고 규칙 안에 있다', () => {
    expect(doc.dancers).toHaveLength(50)
    expect(doc.formations).toHaveLength(200)
    expect(doc.dancers.every((d) => d.name.length === 20)).toBe(true)
    expect(doc.teamFile.name.length).toBe(200)
    doc.formations.forEach((f, n) => {
      if (n > 0) expect(f.startMs).toBeGreaterThan(doc.formations[n - 1].startMs)
      expect(f.startMs).toBeLessThanOrEqual(1_800_000)
      for (const p of Object.values(f.positions)) {
        expect(String(p.x)).toHaveLength(7)
        expect(p.x).toBeGreaterThanOrEqual(-0.1)
      }
    })
  })
  it('PUT 본문은 약 0.67MB로 1MB(10^6바이트) 안이다', () => {
    const bytes = new TextEncoder().encode(JSON.stringify({ baseRevision: 1, content: doc })).length
    expect(bytes).toBeGreaterThan(600_000)
    expect(bytes).toBeLessThan(1_000_000)
  })
})
