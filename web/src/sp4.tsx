// SP-4: Supabase 카카오 로그인. 요청 scope, 가입 가능 여부, 인앱 복귀, user_metadata 키, JWT alg를 확인한다.
// 값(닉네임, 사진 URL, 이메일)은 로그에 남기지 않고 키 이름과 있음·없음만 남긴다. 그래도 로그는 커밋하지 않는다(계획 T14).
import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import type { Session } from '@supabase/supabase-js'
import { log } from './log'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined
// PKCE: 인앱 브라우저에서 더 까다로운 흐름(code verifier 보관)을 잰다. 흐름 선택은 M1에서 정한다. 토큰이 주소 #에 실리지 않는다.
const supabase = url && key ? createClient(url, key, { auth: { flowType: 'pkce' } }) : null
const redirectTo = `${location.origin}/?sp=4`

function decodePart(part: string): Record<string, unknown> {
  const b64 = part.replace(/-/g, '+').replace(/_/g, '/')
  const padded = b64 + '='.repeat((4 - (b64.length % 4)) % 4)
  const bytes = Uint8Array.from(atob(padded), (c) => c.charCodeAt(0))
  return JSON.parse(new TextDecoder().decode(bytes)) as Record<string, unknown>
}

export default function Sp4() {
  const [session, setSession] = useState<Session | null>(null)
  const [report, setReport] = useState('')

  useEffect(() => {
    const q = new URLSearchParams(location.search)
    if (q.has('error')) log(`복귀 주소의 오류: ${q.get('error')} / ${q.get('error_description')}`)
    if (!supabase) {
      log('VITE_SUPABASE_URL 또는 VITE_SUPABASE_PUBLISHABLE_KEY가 빌드에 없다(Pages Preview 변수 확인)')
      return
    }
    const { data } = supabase.auth.onAuthStateChange((event, s) => {
      log(`auth 이벤트: ${event}`)
      setSession(s)
    })
    return () => data.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!supabase || !session) return
    void (async () => {
      const [h, p] = session.access_token.split('.')
      const header = decodePart(h)
      const payload = decodePart(p)
      const { data, error } = await supabase.auth.getUser()
      const u = data.user
      const jwks = await fetch(`${url}/auth/v1/.well-known/jwks.json`)
        .then((r) => r.json() as Promise<{ keys?: { kid: string; alg: string; kty: string; crv?: string }[] }>)
        .catch((e: unknown) => ({ keys: undefined, error: String(e) }))
      const r = {
        getUserError: error?.message ?? null,
        provider: u?.app_metadata?.provider,
        emailPresent: Boolean(u?.email),
        user_metadata_keys: Object.keys(u?.user_metadata ?? {}),
        name_present: Boolean(u?.user_metadata?.name),
        identity_data_keys: Object.keys(u?.identities?.[0]?.identity_data ?? {}),
        jwt_alg: header.alg,
        jwt_kid: header.kid,
        jwt_iss: payload.iss,
        jwt_aud: payload.aud,
        jwks: jwks.keys?.map((k) => `${k.kid} ${k.alg} ${k.kty}${k.crv ? '/' + k.crv : ''}`) ?? jwks,
      }
      setReport(JSON.stringify(r, null, 2))
      log(`SP-4 결과: ${JSON.stringify(r)}`)
    })()
  }, [session])

  if (!supabase) return <p>Supabase 환경변수가 없다.</p>
  const login = async () => {
    log('카카오 로그인 시작')
    const { error } = await supabase.auth.signInWithOAuth({ provider: 'kakao', options: { redirectTo } })
    if (error) log(`로그인 시작 실패: ${error.message}`)
  }
  const showAuthorizeUrl = async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'kakao',
      options: { redirectTo, skipBrowserRedirect: true },
    })
    log(error ? `실패: ${error.message}` : `authorize URL(PC에서 curl로 카카오 scope 확인): ${data.url}`)
  }
  const logout = async () => {
    const { error } = await supabase.auth.signOut()
    log(error ? `로그아웃 실패: ${error.message}` : '로그아웃')
  }

  return (
    <div>
      <p>
        <button onClick={() => void login()} style={{ fontSize: 18 }}>
          카카오로 로그인
        </button>{' '}
        <button onClick={() => void showAuthorizeUrl()}>authorize URL 보기</button>{' '}
        <button onClick={() => void logout()}>로그아웃</button>
      </p>
      <p>세션: {session ? '있음' : '없음'} · 복귀 주소: {redirectTo}</p>
      {report && <pre style={{ whiteSpace: 'pre-wrap', fontSize: 12 }}>{report}</pre>}
    </div>
  )
}
