// §5.3 상한을 꽉 채운 최악 문서(트리아지 T-03): 댄서 50명 × 대형 200개, 좌표 7자, 이름 20자 한글, teamFile 이름 200자 한글.
const HANGUL = '가나다라마바사아자차카타파하'
// 1~79, 끝자리가 0이 아니다 → 좌표가 늘 "-0.01dd" 7자다.
const digits = (a: number) => 1 + (a % 9) + 10 * (Math.floor(a / 9) % 8)

export function makeMaxDoc() {
  const dancers = Array.from({ length: 50 }, (_, i) => ({
    id: crypto.randomUUID(),
    name: HANGUL.repeat(2).slice(0, 18) + String(i).padStart(2, '0'),
    color: '#E4572E',
  }))
  const formations = Array.from({ length: 200 }, (_, f) => ({
    id: crypto.randomUUID(),
    startMs: f * 9000,
    transitionInMs: f === 0 ? 0 : 2000,
    positions: Object.fromEntries(
      dancers.map((d, i) => [d.id, { x: -(100 + digits(i + f)) / 10000, y: -(100 + digits(i * 3 + f)) / 10000 }]),
    ),
  }))
  return {
    v: 1,
    grid: { cols: 24, rows: 16, backstageCols: 1 },
    tempo: { bpm: 118.5, firstBeatMs: 8500 },
    teamFile: { name: HANGUL.repeat(15).slice(0, 196) + '.mp4', durationMs: 1_800_000 },
    dancers,
    formations,
  }
}
