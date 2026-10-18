// 환경 점검: 스펙이 기대는 브라우저 기능이 이 환경에 있는지 한 번에 적는다(§7.2 Web Locks, §7.4 Wake Lock·재생 속도 등).
import { useEffect, useState } from 'react'
import { log } from './log'

type Row = [string, string]

async function collect(): Promise<Row[]> {
  const ua = navigator.userAgent
  const rows: Row[] = [
    ['카톡 인앱', String(/KAKAOTALK/i.test(ua))],
    ['OS 추정', /iPhone|iPad|iPod/i.test(ua) ? 'iOS' : /Android/i.test(ua) ? 'Android' : '기타'],
    ['화면', `${screen.width}×${screen.height} @${devicePixelRatio}`],
    ['홈 화면 앱(standalone)', String(matchMedia('(display-mode: standalone)').matches)],
    ['Web Locks', String('locks' in navigator)],
    ['Wake Lock', String('wakeLock' in navigator)],
    ['preservesPitch', String('preservesPitch' in HTMLMediaElement.prototype)],
    ['webkitPreservesPitch', String('webkitPreservesPitch' in HTMLMediaElement.prototype)],
    ['BroadcastChannel', String(typeof BroadcastChannel === 'function')],
    ['crypto.randomUUID', String(typeof crypto.randomUUID === 'function')],
    ['navigator.share', String(typeof navigator.share === 'function')],
    ['clipboard', String(typeof navigator.clipboard?.writeText === 'function')],
  ]
  try {
    localStorage.setItem('kickoff:probe', '1')
    localStorage.removeItem('kickoff:probe')
    rows.push(['localStorage', 'ok'])
  } catch (e) {
    rows.push(['localStorage', `실패 ${String(e)}`])
  }
  try {
    const est = await navigator.storage?.estimate?.()
    rows.push(['저장소 할당량', est?.quota ? `${Math.round(est.quota / 1e6)}MB` : '알 수 없음'])
  } catch (e) {
    rows.push(['저장소 할당량', `실패 ${String(e)}`])
  }
  if ('locks' in navigator) {
    try {
      await navigator.locks.request('kickoff:probe', { ifAvailable: true }, async (lock) => {
        rows.push(['locks.request', lock ? '획득' : 'null'])
      })
    } catch (e) {
      rows.push(['locks.request', `실패 ${String(e)}`])
    }
  }
  return rows
}

export default function EnvCheck() {
  const [rows, setRows] = useState<Row[]>([])
  useEffect(() => {
    void collect().then((r) => {
      setRows(r)
      log(`환경 점검: ${r.map(([k, v]) => `${k}=${v}`).join(', ')}`)
    })
  }, [])
  return (
    <section>
      <h2>환경 점검</h2>
      <table>
        <tbody>
          {rows.map(([k, v]) => (
            <tr key={k}>
              <th style={{ textAlign: 'left', paddingRight: 12 }}>{k}</th>
              <td>{v}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  )
}
