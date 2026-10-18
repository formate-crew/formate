// 스펙 §7.4 플레이헤드 시계. currentTime이 바뀔 때마다 앵커를 다시 잡고, 그 사이는 performance.now()로 보간한다.
// 정지 중이거나, 재생을 시작한 뒤 currentTime이 처음 바뀌기 전에는 외삽하지 않는다.
export interface Clock {
  /** rAF마다 부른다. 보간한 미디어 시각(ms)을 돌려준다. */
  sample(currentTimeS: number, nowMs: number, playing: boolean, rate?: number): number
  /** 지금까지 앵커를 잡은 횟수. */
  anchors: number
  /** 마지막 재앵커 때 (실제 − 예측) ms. 재생 뒤 첫 앵커면 null. */
  lastJumpMs: number | null
}

export function createClock(): Clock {
  let anchorMedia = 0
  let anchorPerf = 0
  let anchored = false
  let lastMedia = Number.NaN
  const clock: Clock = {
    anchors: 0,
    lastJumpMs: null,
    sample(currentTimeS, nowMs, playing, rate = 1) {
      const media = currentTimeS * 1000
      if (!playing) {
        anchored = false
        clock.lastJumpMs = null
        lastMedia = media
        return media
      }
      if (media !== lastMedia) {
        clock.lastJumpMs = anchored ? media - (anchorMedia + (nowMs - anchorPerf) * rate) : null
        anchorMedia = media
        anchorPerf = nowMs
        anchored = true
        lastMedia = media
        clock.anchors++
        return media
      }
      return anchored ? anchorMedia + (nowMs - anchorPerf) * rate : media
    },
  }
  return clock
}
