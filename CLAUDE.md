# KICKOFF 작업 규칙

이 레포에서 일하는 모든 Claude 세션과 서브에이전트가 읽는다. 사람용 설명은 README와 스펙에 있다.

## 원본
- 범위와 규칙의 원본은 스펙 `docs/superpowers/specs/2026-09-26-kickoff-v1-design.md`다. 스펙과 다르게 만들지 않는다. 바꿔야 하면 멈추고 사용자에게 알린다(이슈 → 트리아지 → 스펙 PR).
- 지금 실행 중인 계획은 `docs/superpowers/plans/`의 가장 최근 파일이다.

## 흐름
- 기본 브랜치는 `develop`. `develop`·`main`에는 직접 push할 수 없다(룰셋).
- 이슈 1개 = 브랜치 1개 = PR 1개. 브랜치: `<type>/<이슈번호>-<짧은-영문>`(예: `feat/12-add-formation`).
- PR 제목(= squash 커밋 제목): `<Jira 키> <type>(<범위>): <요약>`. type: feat, fix, docs, chore, ci, test, refactor. 본문에 `Closes #<이슈>`.
- 커밋 메시지 끝에 `Co-Authored-By: <실제 작성 모델> <noreply@anthropic.com>`을 남긴다.
- `spike/*` 브랜치는 develop에 머지하지 않는다. 스파이크 결과는 문서로만 옮긴다.
- 리뷰 스레드는 수정 커밋이나 사유 답글을 단 뒤에만 resolve한다.

## 영역과 에이전트
| 경로 | 쓰는 쪽 |
|---|---|
| `contract/openapi.yaml` | 오케스트레이터(메인 세션)만 |
| `api/` | `backend` 서브에이전트 또는 오케스트레이터 |
| `web/` | `frontend` 서브에이전트 또는 오케스트레이터 |
| 읽기 전용 | `reviewer`, `researcher` |

쓰기 범위는 `.claude/hooks/area-guard.mjs`가 강제한다. 훅이 막으면 우회하지 말고 오케스트레이터에게 보고한다.

## 모델
- 세션을 열면 `/effort high`(Opus 5.5 기본값은 medium).
- 이슈에 `model:xhigh` 라벨이 있으면 서브에이전트에 맡기지 않고 오케스트레이터가 `/effort xhigh`로 직접 한다(서브에이전트 호출에는 effort를 따로 줄 수 없다).
- Fable은 `model:fable-high` 라벨(스펙 확정·릴리스 리뷰)에만 쓴다.

## 코드와 문서
- UI 문구와 문서는 한국어, 코드 식별자는 영어. 주석은 "왜"가 필요할 때만.
- 비밀값, 개인 이메일, 로그인 테스트로 얻은 타인의 정보는 커밋하지 않는다(공개 레포).
- 명령은 Git Bash 기준. 줄바꿈은 LF(`.gitattributes`).

## 테스트
- 하네스: `node --test .claude/hooks/area-guard.test.mjs`
