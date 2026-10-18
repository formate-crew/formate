// KICKOFF M0 스파이크 랩. 버리는 코드다(스펙 §11). 주소의 ?sp=<번호>로 페이지를 고른다.
import { StrictMode } from 'react'
import type { ComponentType } from 'react'
import { createRoot } from 'react-dom/client'
import EnvCheck from './env-check'
import { LogPanel, log } from './log'

addEventListener('error', (e) => log(`오류: ${e.message}`))
addEventListener('unhandledrejection', (e) => log(`처리 안 된 거부: ${String(e.reason)}`))
const params = new URLSearchParams(location.search)
if (params.has('debug')) void import('eruda').then((m) => m.default.init())

// 스파이크 페이지를 만들 때마다 한 줄씩 더한다(T8~T13).
const pages: Record<string, [string, ComponentType]> = {}

function App() {
  const entry = pages[params.get('sp') ?? '']
  const Page = entry?.[1]
  return (
    <main style={{ padding: 12, fontFamily: 'system-ui, sans-serif', maxWidth: 960, margin: '0 auto' }}>
      <p>
        <a href="./">← 목록</a> · KICKOFF M0 스파이크 랩(버리는 코드) · 문제가 생기면 주소 끝에 <code>&amp;debug</code>
      </p>
      {Page ? (
        <>
          <h1>{entry[0]}</h1>
          <Page />
        </>
      ) : (
        <>
          <h1>스파이크 목록</h1>
          <ul>
            {Object.entries(pages).map(([k, [title]]) => (
              <li key={k}>
                <a href={`?sp=${k}`}>{title}</a>
              </li>
            ))}
          </ul>
          <EnvCheck />
        </>
      )}
      <LogPanel />
    </main>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
