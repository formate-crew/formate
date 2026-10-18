// 사용법: node spike-tools/analyze.mjs <luma.txt> <audio.wav> [녹화 폰 보정 ms] [분석 시작초]
// 녹화 폰 보정 ms = (손뼉 영상 시각 − 손뼉 소리 시각) × 1000. 모든 어긋남에서 뺀다.
// 분석 시작초: 손뼉이 끝난 뒤 시각. 손뼉이 비프보다 커서 문턱을 올려 버리는 것을 막는다.
import { readFileSync } from 'node:fs'
import { flashOnsets, pairUp, parseLuma, stats } from './analyze-lib.mjs'
import { clickOnsets, readWav } from './wav.mjs'

const [lumaPath, wavPath, avArg = '0', startArg = '0'] = process.argv.slice(2)
if (!lumaPath || !wavPath) {
  console.error('사용법: node spike-tools/analyze.mjs <luma.txt> <audio.wav> [녹화 폰 보정 ms] [분석 시작초]')
  process.exit(1)
}
const av = Number(avArg)
const start = Number(startArg)
const flashes = flashOnsets(parseLuma(readFileSync(lumaPath, 'utf8')).filter((f) => f.t >= start))
const { samples, sampleRate } = readWav(wavPath)
const a = Math.floor(start * sampleRate)
const clicks = clickOnsets(samples.subarray(a), sampleRate).map((t) => t + a / sampleRate)
const rows = pairUp(flashes, clicks).map((r) => ({ ...r, offsetMs: r.offsetMs - av }))
for (const r of rows) console.log(`화면 ${r.flash.toFixed(3)}s  소리 ${r.click.toFixed(3)}s  어긋남 ${r.offsetMs >= 0 ? '+' : ''}${r.offsetMs.toFixed(1)}ms`)
const all = stats(rows.map((r) => r.offsetMs))
const pass = rows.filter((r) => Math.abs(r.offsetMs) <= 50).length
console.log(`\n흰 화면 ${flashes.length}개, 비프 ${clicks.length}개, 짝 ${all.n}개, 보정 ${av}ms, 시작 ${start}s`)
console.log(`평균 ${all.mean.toFixed(1)}ms, 표준편차 ${all.sd.toFixed(1)}ms, 최소 ${all.min.toFixed(1)}ms, 최대 ${all.max.toFixed(1)}ms`)
console.log(`|어긋남| ≤ 50ms: ${pass}/${all.n}`)
for (let i = 0; i < rows.length; i += 20) {
  const s = stats(rows.slice(i, i + 20).map((r) => r.offsetMs))
  console.log(`  ${rows[i].flash.toFixed(0)}s부터 20개: 평균 ${s.mean.toFixed(1)}ms, 최대 |어긋남| ${Math.max(Math.abs(s.min), Math.abs(s.max)).toFixed(1)}ms`)
}
