// KICKOFF M0 스파이크 랩. 버리는 코드다(스펙 §11). 주소의 ?sp=<번호>로 페이지를 고른다.
import { StrictMode } from 'react'
import type { ComponentType } from 'react'
import { createRoot } from 'react-dom/client'
import EnvCheck from './env-check'
import { LogPanel, log } from './log'
import Sp1 from './sp1'
import Sp2 from './sp2'
import Sp3 from './sp3'
import Sp4 from './sp4'

addEventListener('error', (e) => log(`오류: ${e.message}`))
addEventListener('unhandledrejection', (e) => log(`처리 안 된 거부: ${String(e.reason)}`))
const params = new URLSearchParams(location.search)
if (params.has('debug')) void import('eruda').then((m) => m.default.init())

// 스파이크 페이지를 만들 때마다 한 줄씩 더한다(T8~T13).
const pages: Record<string, [string, ComponentType]> = {
  '1': ['SP-1 파일·재생·화면 유지', Sp1],
  '2': ['SP-2 외부 브라우저로 열기', Sp2],
  '3': ['SP-3 싱크 정확도', Sp3],
  '4': ['SP-4 카카오 로그인', Sp4],
}

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
