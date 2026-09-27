// 서브에이전트의 쓰기 범위를 판단한다(스펙 §3.3 에이전트 격리).
// contract/는 오케스트레이터(메인 세션 = agent_type 없음)만, backend는 api/만, frontend는 web/만,
// reviewer·researcher는 아무것도 쓰지 않는다. 편의 장치이지 보안 경계가 아니다(Bash 쓰기는 보지 않는다).
import { existsSync } from 'node:fs'
import { dirname, isAbsolute, relative, resolve, sep } from 'node:path'

const ONLY = { backend: 'api', frontend: 'web' }
const READ_ONLY = new Set(['reviewer', 'researcher'])

export function repoRoot(start) {
  let dir = resolve(start)
  for (;;) {
    if (existsSync(resolve(dir, '.git'))) return dir
    const up = dirname(dir)
    if (up === dir) return resolve(start)
    dir = up
  }
}

/** 막을 이유를 돌려준다. 허용이면 null. 판단할 수 없는 입력은 허용한다. */
export function decide(input) {
  const agent = input?.agent_type
  const file = input?.tool_input?.file_path ?? input?.tool_input?.notebook_path
  if (!agent || typeof file !== 'string' || typeof input.cwd !== 'string') return null
  if (READ_ONLY.has(agent)) return `${agent}는 읽기 전용이다. 필요한 변경을 보고하라.`
  const root = repoRoot(input.cwd)
  const rel = relative(root, resolve(input.cwd, file)).split(sep).join('/')
  if (rel === '..' || rel.startsWith('../') || isAbsolute(rel)) return `${agent}는 레포 밖(${file})을 쓸 수 없다.`
  const top = rel.split('/')[0]
  if (top === 'contract') return 'contract/는 오케스트레이터만 고친다(스펙 §3.3). 필요한 변경을 보고하라.'
  const only = ONLY[agent]
  if (only && top !== only) return `${agent}는 ${only}/ 아래만 쓴다. 막힌 경로: ${rel}`
  return null
}
