// PreToolUse 훅 진입점. 판단은 area-guard-lib.mjs, 결과는 JSON으로 내고 항상 종료 코드 0.
import { decide } from './area-guard-lib.mjs'

let raw = ''
for await (const chunk of process.stdin) raw += chunk
let input
try {
  input = JSON.parse(raw)
} catch {
  process.exit(0)
}
const reason = decide(input)
if (reason) {
  process.stdout.write(JSON.stringify({
    hookSpecificOutput: { hookEventName: 'PreToolUse', permissionDecision: 'deny', permissionDecisionReason: reason },
  }))
}
