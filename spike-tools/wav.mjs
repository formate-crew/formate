// SP-3 분석용 WAV 읽기와 클릭 검출. 모노 16비트 PCM만 받는다(ffmpeg -ac 1 -c:a pcm_s16le).
import { readFileSync } from 'node:fs'

export function readWav(path) {
  const buf = readFileSync(path)
  if (buf.toString('ascii', 0, 4) !== 'RIFF' || buf.toString('ascii', 8, 12) !== 'WAVE') throw new Error('RIFF/WAVE가 아니다')
  let off = 12
  let fmt = null
  let data = null
  while (off + 8 <= buf.length) {
    const id = buf.toString('ascii', off, off + 4)
    const size = buf.readUInt32LE(off + 4)
    const body = off + 8
    if (id === 'fmt ') fmt = { format: buf.readUInt16LE(body), channels: buf.readUInt16LE(body + 2), rate: buf.readUInt32LE(body + 4), bits: buf.readUInt16LE(body + 14) }
    if (id === 'data') data = { start: body, size: Math.min(size, buf.length - body) }
    off = body + size + (size % 2)
  }
  if (!fmt || !data) throw new Error('fmt 또는 data 청크가 없다')
  if (fmt.format !== 1 || fmt.bits !== 16 || fmt.channels !== 1) throw new Error(`모노 16비트 PCM이 아니다: ${JSON.stringify(fmt)}`)
  const samples = new Int16Array(data.size / 2)
  for (let i = 0; i < samples.length; i++) samples[i] = buf.readInt16LE(data.start + i * 2)
  return { samples, sampleRate: fmt.rate }
}

/** 클릭 시작 시각(초). 파일 최대 진폭의 ratio를 처음 넘는 샘플이고, 그 뒤 minGapS 동안은 무시한다. */
export function clickOnsets(samples, sampleRate, ratio = 0.5, minGapS = 0.1) {
  let max = 0
  for (const s of samples) max = Math.max(max, Math.abs(s))
  const threshold = max * ratio
  const gap = Math.round(minGapS * sampleRate)
  const out = []
  let last = -gap
  for (let i = 0; i < samples.length; i++) {
    if (Math.abs(samples[i]) >= threshold && i - last >= gap) {
      out.push(i / sampleRate)
      last = i
    }
  }
  return out
}
