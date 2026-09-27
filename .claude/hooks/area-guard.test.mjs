import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdirSync, mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { decide } from './area-guard-lib.mjs'

const root = mkdtempSync(join(tmpdir(), 'guard-'))
mkdirSync(join(root, '.git'))
const inp = (agent, file, cwd = root) => ({
  hook_event_name: 'PreToolUse',
  tool_name: 'Write',
  cwd,
  tool_input: { file_path: file },
  ...(agent ? { agent_type: agent } : {}),
})

test('메인 세션(agent_type 없음)은 contract/도 쓸 수 있다', () => {
  assert.equal(decide(inp(undefined, join(root, 'contract', 'openapi.yaml'))), null)
})

test('backend는 api/ 아래를 쓸 수 있다', () => {
  assert.equal(decide(inp('backend', join(root, 'api', 'src', 'A.java'))), null)
})

test('backend는 web/을 쓸 수 없다', () => {
  assert.match(decide(inp('backend', join(root, 'web', 'src', 'a.ts'))), /api\//)
})

test('backend는 web/api/처럼 이름만 같은 경로를 쓸 수 없다', () => {
  assert.notEqual(decide(inp('backend', join(root, 'web', 'api', 'x.ts'))), null)
})

test('frontend는 web/만 쓴다', () => {
  assert.equal(decide(inp('frontend', join(root, 'web', 'src', 'a.ts'))), null)
  assert.notEqual(decide(inp('frontend', join(root, 'api', 'A.java'))), null)
})

test('어떤 서브에이전트도 contract/를 쓸 수 없다', () => {
  for (const a of ['backend', 'frontend', 'general-purpose']) {
    assert.match(decide(inp(a, join(root, 'contract', 'openapi.yaml'))), /오케스트레이터/)
  }
})

test('reviewer와 researcher는 아무것도 쓸 수 없다', () => {
  for (const a of ['reviewer', 'researcher']) {
    assert.match(decide(inp(a, join(root, 'docs', 'x.md'))), /읽기 전용/)
  }
})

test('상대 경로와 .. 우회도 판단한다', () => {
  assert.notEqual(decide(inp('backend', 'api/../web/x.ts')), null)
  assert.equal(decide(inp('backend', 'api/src/B.java')), null)
})

test('레포 밖은 막는다', () => {
  assert.match(decide(inp('backend', join(tmpdir(), 'elsewhere.txt'))), /레포 밖/)
})

test('하위 폴더가 cwd여도 레포 루트를 찾는다', () => {
  mkdirSync(join(root, 'api', 'src'), { recursive: true })
  assert.equal(decide(inp('backend', 'Main.java', join(root, 'api', 'src'))), null)
})

test('그 밖의 서브에이전트는 contract/ 말고는 막지 않는다', () => {
  assert.equal(decide(inp('general-purpose', join(root, 'docs', 'x.md'))), null)
})

const hook = fileURLToPath(new URL('./area-guard.mjs', import.meta.url))
const run = (stdin) => spawnSync(process.execPath, [hook], { input: stdin, encoding: 'utf8' })

test('훅 프로세스: 막으면 deny JSON, 허용이면 출력 없음, 둘 다 종료 코드 0', () => {
  const denied = run(JSON.stringify(inp('backend', join(root, 'web', 'a.ts'))))
  assert.equal(denied.status, 0)
  assert.equal(JSON.parse(denied.stdout).hookSpecificOutput.permissionDecision, 'deny')
  const allowed = run(JSON.stringify(inp('backend', join(root, 'api', 'a.java'))))
  assert.equal(allowed.status, 0)
  assert.equal(allowed.stdout, '')
})

test('깨진 입력은 막지 않는다(훅 오류로 작업이 멈추지 않게)', () => {
  const r = run('not json')
  assert.equal(r.status, 0)
  assert.equal(r.stdout, '')
})
