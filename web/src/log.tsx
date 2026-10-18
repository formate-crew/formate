// 기기 세션에서 결과를 꺼내는 통로. 카톡 인앱에서 클립보드가 막혀도 공유나 전체 선택으로 꺼낼 수 있게 한다.
import { useEffect, useRef, useSyncExternalStore } from 'react'

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
  const boxRef = useRef<HTMLTextAreaElement>(null)
  // 로그 칸은 화면 아래에 있어 새 줄이 보이지 않는다(내 폰 확인: SP-5b A1 버튼이 "아무 일 없음"으로 보였다).
  // 그래서 칸은 맨 아래로 내리고, 마지막 줄은 화면 아래 띠에 늘 보여 준다.
  useEffect(() => {
    if (boxRef.current) boxRef.current.scrollTop = boxRef.current.scrollHeight
  }, [current])
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
    <section style={{ marginTop: 24, paddingBottom: 32 }}>
      <h2>로그</h2>
      <button onClick={copy}>로그 복사</button>{' '}
      {typeof navigator.share === 'function' && <button onClick={share}>로그 공유</button>}
      <textarea ref={boxRef} readOnly value={text} rows={14} style={{ width: '100%', fontSize: 12 }} />
      {current.length > 0 && (
        <div style={{ position: 'fixed', left: 0, right: 0, bottom: 0, padding: '4px 8px', background: 'rgba(0,0,0,0.8)', color: '#fff', fontSize: 12, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', pointerEvents: 'none' }}>
          {current[current.length - 1]}
        </div>
      )}
    </section>
  )
}
