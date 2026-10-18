// SP-2: 카톡 인앱 브라우저에서 외부 브라우저로 여는 방법(비공식 기법)을 하나씩 눌러 본다.
import { useEffect } from 'react'
import { log } from './log'

const RESULTS = ['외부 브라우저로 열림', '아무 일 없음', '오류·경고 화면']

export default function Sp2() {
  const ua = navigator.userAgent
  const inKakao = /KAKAOTALK/i.test(ua)
  const escaped = new URLSearchParams(location.search).get('from') === 'escape'
  const target = `${location.origin}/?sp=2&from=escape`
  const hostPath = target.replace(/^https:\/\//, '')
  const methods: [string, string][] = [
    ['A. kakaotalk://web/openExternal', `kakaotalk://web/openExternal?url=${encodeURIComponent(target)}`],
    ['B. Android intent (Chrome 지정)', `intent://${hostPath}#Intent;scheme=https;package=com.android.chrome;end`],
    ['C. Android intent (기본 브라우저)', `intent://${hostPath}#Intent;scheme=https;end`],
  ]

  useEffect(() => {
    log(`SP-2 진입: 카톡 인앱=${inKakao}, 탈출해서 온 페이지=${escaped}`)
  }, [inKakao, escaped])

  return (
    <div>
      <p style={{ fontSize: 20 }}>
        지금 카톡 인앱: <b>{inKakao ? '예' : '아니오'}</b>
        {escaped && ' · 외부로 넘어와 연 페이지다(UA를 로그에서 확인)'}
      </p>
      {methods.map(([label, href]) => (
        <div key={label} style={{ margin: '12px 0', padding: 8, border: '1px solid #ccc' }}>
          <a href={href} onClick={() => log(`시도: ${label}`)} style={{ fontSize: 18 }}>
            {label}
          </a>
          <div>
            결과:{' '}
            {RESULTS.map((r) => (
              <button key={r} onClick={() => log(`결과: ${label} → ${r}`)} style={{ marginRight: 4 }}>
                {r}
              </button>
            ))}
          </div>
        </div>
      ))}
      <h2>수동 경로 (기기에서 실제 메뉴 이름을 확인해 적는다)</h2>
      <ul>
        <li>Android 카톡: 오른쪽 위 ⋮ → "다른 브라우저로 열기"</li>
        <li>iOS 카톡: 공유(또는 ⋯) 버튼 → Safari로 열기</li>
      </ul>
      <button onClick={() => log('수동 경로: 성공')}>수동 경로 성공</button>{' '}
      <button onClick={() => log('수동 경로: 메뉴를 못 찾음')}>메뉴를 못 찾음</button>
    </div>
  )
}
