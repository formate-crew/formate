// 기기 세션에서 결과를 꺼내는 통로. 카톡 인앱에서 클립보드가 막혀도 공유나 전체 선택으로 꺼낼 수 있게 한다.
import { useSyncExternalStore } from 'react'

let lines: string[] = []
const listeners = new Set<() => void>()

export function log(msg: string): void {
  const t = new Date().toISOString().slice(11, 23)
  lines = [...lines, `${t} ${msg}`]
  console.log(msg)
  listeners.forEach((l) => l())
}

function subscribe(l: () => void) {
  listeners.add(l)
  return () => {
    listeners.delete(l)
  }
}

export function LogPanel() {
  const current = useSyncExternalStore(subscribe, () => lines)
  const text = [`UA: ${navigator.userAgent}`, `URL: ${location.origin}${location.pathname}${location.search.replace(/([?&]code=)[^&]*/, "$1(생략)")}`, ...current].join('\n')
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      log('로그를 복사했다')
    } catch (e) {
      log(`복사 실패(${String(e)}). 아래 칸을 길게 눌러 전체 선택 후 복사하거나, 로그 공유를 누르거나, 화면을 찍는다`)
    }
  }
  const share = async () => {
    try {
      await navigator.share({ text })
    } catch (e) {
      log(`공유 실패: ${String(e)}`)
    }
  }
  return (
    <section style={{ marginTop: 24 }}>
      <h2>로그</h2>
      <button onClick={copy}>로그 복사</button>{' '}
      {typeof navigator.share === 'function' && <button onClick={share}>로그 공유</button>}
      <textarea readOnly value={text} rows={14} style={{ width: '100%', fontSize: 12 }} />
    </section>
  )
}
