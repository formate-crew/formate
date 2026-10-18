// SP-5 무대 규칙(스펙 §5.3·§7.3, 트리아지 T-03·§2)을 스파이크용으로 옮긴 것. 제품 코드가 아니다.
export type Pos = { x: number; y: number }

const round4 = (v: number) => Math.round(v * 1e4) / 1e4

/** 새 댄서 i의 자리(§7.3). spread면 트리아지 §2 비켜 놓기: 바퀴 k마다 x를 바깥쪽으로 k/60. */
export function initialPos(i: number, cols: number, rows: number, spread: boolean): Pos {
  const s = i % (2 * rows)
  const off = spread ? Math.floor(i / (2 * rows)) / 60 : 0
  return s < rows
    ? { x: round4(0.5 / cols - off), y: round4((s + 0.5) / rows) }
    : { x: round4(1 - 0.5 / cols + off), y: round4((s - rows + 0.5) / rows) }
}

/** −0.1~1.1 안의 0.5칸 교차점 가운데 가장 가까운 점(§7.3 토큰 드래그). */
export function snap(v: number, cells: number): number {
  const step = 0.5 / cells
  const lo = Math.ceil(-0.1 / step - 1e-9)
  const hi = Math.floor(1.1 / step + 1e-9)
  return round4(Math.min(Math.max(Math.round(v / step), lo), hi) * step)
}

/** 백스테이지 판정(§5.3 + 트리아지 T-03: 경계선 위는 무대). */
export function isBackstage(p: Pos, cols: number): boolean {
  return p.x < 1 / cols - 1e-4 || p.x > 1 - 1 / cols + 1e-4 || p.y < 0 || p.y > 1
}
