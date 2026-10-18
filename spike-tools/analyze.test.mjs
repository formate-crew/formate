// 사용법: node --test spike-tools/analyze.test.mjs
// 1) 순수 JS로 만든 가짜 녹화에서 알려진 어긋남(+50ms)을 되찾는지  2) ffmpeg이 있으면 실제 인코딩을 거친 합성 영상에서도 되찾는지.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'
import { flashOnsets, pairUp, parseLuma, stats } from './analyze-lib.mjs'
import { clickOnsets, readWav } from './wav.mjs'

const RATE = 48000
const BEATS = [1.0, 1.5, 2.0, 2.5]

function writeWav(path, samples) {
  const data = Buffer.alloc(samples.length * 2)
  samples.forEach((s, i) => data.writeInt16LE(s, i * 2))
  const h = Buffer.alloc(44)
  h.write('RIFF', 0)
  h.writeUInt32LE(36 + data.length, 4)
  h.write('WAVE', 8)
  h.write('fmt ', 12)
  h.writeUInt32LE(16, 16)
  h.writeUInt16LE(1, 20)
  h.writeUInt16LE(1, 22)
  h.writeUInt32LE(RATE, 24)
  h.writeUInt32LE(RATE * 2, 28)
  h.writeUInt16LE(2, 32)
  h.writeUInt16LE(16, 34)
  h.write('data', 36)
  h.writeUInt32LE(data.length, 40)
  writeFileSync(path, Buffer.concat([h, data]))
}

test('WAV의 비프 시작을 1ms 안으로 찾는다', () => {
  const samples = new Int16Array(RATE * 3)
  for (const b of BEATS) for (let i = 0; i < 0.03 * RATE; i++) samples[Math.round(b * RATE) + i] = Math.round(26000 * Math.sin((2 * Math.PI * 1000 * i) / RATE))
  const path = join(mkdtempSync(join(tmpdir(), 'sp3-')), 'beeps.wav')
  writeWav(path, samples)
  const { samples: read, sampleRate } = readWav(path)
  const onsets = clickOnsets(read, sampleRate)
  assert.equal(onsets.length, BEATS.length)
  onsets.forEach((t, k) => assert.ok(Math.abs(t - BEATS[k]) < 0.001, `${t} vs ${BEATS[k]}`))
})

test('60fps 밝기 기록에서 흰 화면 시작을 찾고, 비프와 짝지어 +50ms를 되찾는다', () => {
  let text = ''
  for (let n = 0; n < 180; n++) {
    const t = n / 60
    const white = BEATS.some((b) => t >= b + 0.05 - 1e-9 && t < b + 0.11)
    text += `frame:${n}    pts:${n * 1000}    pts_time:${t}\nlavfi.signalstats.YAVG=${white ? 235 : 16}.000000\n`
  }
  const flashes = flashOnsets(parseLuma(text))
  assert.equal(flashes.length, BEATS.length)
  const s = stats(pairUp(flashes, BEATS).map((r) => r.offsetMs))
  assert.equal(s.n, 4)
  assert.ok(Math.abs(s.mean - 50) < 17, `평균 ${s.mean}`)
})

const hasFfmpeg = spawnSync('ffmpeg', ['-version']).status === 0

test('ffmpeg 합성 영상(비프 1.000s+0.5k, 흰 화면 1.040s+0.5k)에서 +50ms(60fps 양자화)를 되찾는다', { skip: !hasFfmpeg && 'ffmpeg 없음' }, () => {
  const dir = mkdtempSync(join(tmpdir(), 'sp3-'))
  const run = (args) => {
    const r = spawnSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', ...args], { cwd: dir, encoding: 'utf8' })
    assert.equal(r.status, 0, r.stderr)
  }
  run([
    '-f', 'lavfi', '-i', 'color=c=black:s=320x240:r=60:d=20',
    '-f', 'lavfi', '-i', "aevalsrc='if(gte(t,1)*lt(mod(t-1,0.5),0.03),0.8*sin(2*PI*1000*t),0)':s=48000:d=20",
    '-vf', "drawbox=x=0:y=0:w=iw:h=ih:color=white:t=fill:enable='gte(t,1.04)*lt(mod(t-1.04,0.5),0.06)'",
    '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-shortest', 'synthetic.mp4',
  ])
  run(['-i', 'synthetic.mp4', '-vf', 'signalstats,metadata=print:key=lavfi.signalstats.YAVG:file=luma.txt', '-f', 'null', '-'])
  run(['-i', 'synthetic.mp4', '-vn', '-ac', '1', '-ar', '48000', '-c:a', 'pcm_s16le', 'audio.wav'])
  const flashes = flashOnsets(parseLuma(readFileSync(join(dir, 'luma.txt'), 'utf8')))
  const { samples, sampleRate } = readWav(join(dir, 'audio.wav'))
  const s = stats(pairUp(flashes, clickOnsets(samples, sampleRate)).map((r) => r.offsetMs))
  assert.ok(s.n >= 35, `짝 ${s.n}개`)
  assert.ok(s.mean > 45 && s.mean < 55, `평균 ${s.mean}ms (50 근처여야 한다)`)
  assert.ok(s.sd < 3, `표준편차 ${s.sd}ms`)
})
