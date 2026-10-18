// SP-3 분석 로직. 녹화의 프레임 밝기(ffmpeg signalstats)에서 흰 화면 시작을, WAV에서 비프 시작을 찾아 짝짓는다.
// 어긋남 = 화면 − 소리(ms). 양수면 그림이 소리보다 늦다. 스펙 §8 정의: |어긋남| ≤ 50ms.

/** ffmpeg `metadata=print:key=lavfi.signalstats.YAVG` 출력을 [{t, y}]로 읽는다. */
export function parseLuma(text) {
  const frames = []
  let t = null
  for (const line of text.split(/\r?\n/)) {
    const pts = line.match(/pts_time:(-?[\d.]+)/)
    if (pts) {
      t = Number(pts[1])
      continue
    }
    const y = line.match(/lavfi\.signalstats\.YAVG=([\d.]+)/)
    if (y && t !== null) frames.push({ t, y: Number(y[1]) })
  }
  return frames
}

/** 밝기가 문턱(하위 5%와 상위 5% 밝기의 중간)을 아래에서 위로 넘는 프레임 시각들. */
export function flashOnsets(frames) {
  if (frames.length < 2) return []
  const ys = frames.map((f) => f.y).sort((a, b) => a - b)
  const threshold = (ys[Math.floor(ys.length * 0.05)] + ys[Math.floor(ys.length * 0.95)]) / 2
  const out = []
  for (let i = 1; i < frames.length; i++) if (frames[i - 1].y < threshold && frames[i].y >= threshold) out.push(frames[i].t)
  return out
}

/** 흰 화면마다 가장 가까운 비프를 짝짓는다(maxGapS 안에서). */
export function pairUp(flashes, clicks, maxGapS = 0.25) {
  const rows = []
  for (const f of flashes) {
    let best = null
    for (const c of clicks) if (best === null || Math.abs(c - f) < Math.abs(best - f)) best = c
    if (best !== null && Math.abs(best - f) <= maxGapS) rows.push({ flash: f, click: best, offsetMs: (f - best) * 1000 })
  }
  return rows
}

export function stats(values) {
  const n = values.length
  if (!n) return { n: 0, mean: NaN, sd: NaN, min: NaN, max: NaN }
  const mean = values.reduce((a, b) => a + b, 0) / n
  const sd = Math.sqrt(values.reduce((a, b) => a + (b - mean) ** 2, 0) / n)
  return { n, mean, sd, min: Math.min(...values), max: Math.max(...values) }
}
