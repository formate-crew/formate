// 사용법: node spike-tools/onsets.mjs <audio.wav> [시작초] [끝초]
// 구간 안의 클릭(비프·손뼉) 시작 시각을 출력한다. 문턱은 그 구간의 최대 진폭 기준이다. 생성 파일 확인과 손뼉 보정에 쓴다.
import { clickOnsets, readWav } from './wav.mjs'

const [path, from = '0', to] = process.argv.slice(2)
if (!path) {
  console.error('사용법: node spike-tools/onsets.mjs <audio.wav> [시작초] [끝초]')
  process.exit(1)
}
const { samples, sampleRate } = readWav(path)
const a = Math.max(0, Math.floor(Number(from) * sampleRate))
const b = to === undefined ? samples.length : Math.min(samples.length, Math.floor(Number(to) * sampleRate))
const onsets = clickOnsets(samples.subarray(a, b), sampleRate).map((t) => t + a / sampleRate)
console.log(`${onsets.length}개: ${onsets.slice(0, 10).map((t) => t.toFixed(4)).join(', ')}${onsets.length > 10 ? ' …' : ''}`)
if (onsets.length > 1) console.log(`마지막: ${onsets[onsets.length - 1].toFixed(4)}`)
