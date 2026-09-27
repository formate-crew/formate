# KICKOFF M0 (준비·스파이크) 구현 계획

> **에이전트 작업자에게:** 필수 하위 스킬: superpowers:subagent-driven-development(권장) 또는 superpowers:executing-plans로 이 계획을 태스크 단위로 실행한다. 단계는 체크박스(`- [ ]`)로 추적한다.

**Goal:** 레포·프로세스(보호 규칙, CI, 하네스, AI 리뷰, Jira/Projects)를 세우고, 버리는 스파이크 SP-1~6으로 실기기 사실을 잰 뒤, 그 결과로 스펙을 고치는 PR을 머지한다(스펙 §10 M0 끝나는 조건).

**Architecture:** 모노레포 하나(`web/`, `api/`, `contract/`, `docs/`)를 새 무료 GitHub 조직의 공개 레포로 만든다. M0의 `develop`에는 문서·CI·하네스만 들어가고 제품 코드는 없다. 스파이크 코드는 `spike/m0-lab` 브랜치의 `web/`에만 있고 Cloudflare Pages 미리보기로만 연다. 결과표와 스펙 수정만 PR로 `develop`에 들어간다.

**Tech Stack:** Git for Windows(Git Bash) · gh 2.98 · GitHub rulesets/Actions/Projects · anthropics/claude-code-action@v1 · Claude Code 2.1.283 하네스(서브에이전트, PreToolUse 훅) · Jira Cloud Free + GitHub for Atlassian · Cloudflare Pages · Supabase(서울, Auth만) · Kakao Developers · 스파이크: Vite + React + TypeScript, @supabase/supabase-js 2.x, Vitest, Node 24 · ffmpeg(Gyan.FFmpeg)

**Spec:** `docs/superpowers/specs/2026-09-26-kickoff-v1-design.md`(확정 초안 3판) + `docs/reviews/2026-09-26-external-review-triage.md`(승인된 트리아지, Task 3에서 스펙에 반영)

---

## 이 계획을 읽는 법

- **👤 사용자 / 🤖 오케스트레이터:** 단계마다 누가 하는지 표시한다. 👤는 웹 콘솔, 휴대폰, 비밀값처럼 사람이 해야 하는 일이다. 🤖는 Claude Code 메인 세션(오케스트레이터)이 한다. 표시가 없으면 🤖다.
- **변수:** 명령에 나오는 `$NAME`, `$ORG`, `$REPO`, `$KEY`, `$JIRA_SITE`, `$PAGES`, `$SUPA_REF`와 스토리 키 `$S_*`는 Task 0·2·6에서 정해 `~/.kickoff-env`에 적는다. 명령은 모두 **Git Bash** 기준이다.
- **셸 상태는 이어지지 않는다:** Claude Code의 Bash 도구는 호출마다 환경변수를 잃는다(작업 폴더만 이어진다). 그래서 변수를 쓰는 명령 블록은 모두 `source ~/.kickoff-env`로 시작하고, 폴더가 중요한 블록은 `cd /c/project/KICKOFF`로 시작한다. 이슈 번호 `N`은 저장하지 않고 브랜치 이름(`<type>/<N>-<slug>`)에서 다시 얻는다.
- **이슈 번호:** 이슈와 PR은 번호를 공유한다. 부트스트랩에는 PR이 없으므로 첫 이슈(스펙 PR 이슈)만 #1로 확정된다. 그 밖의 번호는 `gh`가 출력한 값을 쓴다.
- **gh에 `--repo`를 주면 PR 인자가 필수다:** `gh pr checks`·`gh pr merge`에는 PR 번호나 브랜치 이름을 꼭 준다(예: `"$(git branch --show-current)"`, 릴리스는 `develop`).
- **모델:** 각 태스크 머리에 스펙 §3.3의 모델 배정을 적었다. 세션을 열 때마다 `/effort high`를 먼저 한다(Opus 5.5 기본값은 medium).
- **실무 관점:** 태스크마다 "왜 이 단계가 있는가"를 한 단락으로 붙였다. 사용자가 명시적으로 요청한 학습 장치다.

### 순서와 스프린트

| 스프린트 | 태스크 | 누가 | 어림 |
|---|---|---|---|
| 1 (셋업) | T0 사전 결정 · T1 레포 부트스트랩 · T2 트래킹 · T3 스펙 PR(#1) · T4 하네스 · T5 AI 리뷰 봇 · T6 외부 서비스 · T16 릴리스(스프린트 1) | 👤+🤖 | 약 4.5일 |
| 2 (스파이크) | T7 랩 뼈대 · T8 SP-1 · T9 SP-2 · T10 SP-3 · T11 SP-4 · T12 SP-5a · T13 SP-5b · T14 기기 세션(+SP-6) · T15 결과·스펙 PR · T16 릴리스(스프린트 2) | 👤+🤖 | 약 6.5일 |

- 학기 중 페이스(주 2.5~3일)면 스프린트 하나가 1주를 넘길 수 있다. 과약속하지 않는다(스펙 §3.3). 넘치면 다음 스프린트로 넘기고, 스프린트 1이 끝나면 벨로시티를 잰다(T16).
- 10월 말 시험 기간(스펙 §10)을 피해 **T14 기기 세션을 먼저 날짜로 잡는다**(T0-6).

## Global Constraints

모든 태스크의 요구 사항에 아래가 암묵적으로 들어간다. 값은 스펙에서 그대로 옮겼다.

- 스펙이 범위의 원본이다. 스펙은 **이슈 → 트리아지 → 스펙 PR**로만 바꾼다(§0).
- 기본 브랜치는 `develop`. feature→develop PR은 매일, develop→main 릴리스 PR은 스프린트마다(§3.3).
- 보호 규칙은 룰셋으로 건다. 레포 설정에서 merge commit과 squash를 둘 다 켠다. **`develop`:** PR 필수, `ci-ok` 필수, 대화 해결 필수, **squash만**, 관리자 우회 금지, 필수 승인 0. **`main`:** PR 필수, `ci-ok` 필수, **merge commit만**. 릴리스 PR의 head는 `develop`만, hotfix 브랜치 없음(§3.3).
- AI 리뷰: CI의 claude-code-action, `pull_request` 트리거(`branches: [develop]`)만, 필수 체크 아님. 재리뷰는 로컬 `/code-review <PR> --comment`. 대화는 수정 커밋이나 사유 답글을 단 뒤에만 resolve(§3.3). `pull_request_target` 금지.
- 태스크는 하루 이하, 이슈 1개 = 브랜치 1개 = PR 1개, 스프린트 1주(§3.3). 예외: T1 부트스트랩(직접 push 1회), 스파이크 브랜치(머지 안 함).
- 모든 워크플로는 `permissions: contents: read`로 시작하고 필요한 잡에서만 넓힌다(§8). 필수 체크는 항상 도는 집계 잡 `ci-ok` 하나다(§8).
- 비밀값은 저장소에 넣지 않는다. 저장소 수준 시크릿은 `CLAUDE_CODE_OAUTH_TOKEN` 하나뿐이다. 공개 레포의 push protection을 켠다(§9.2).
- 스파이크 코드는 `spike/*` 브랜치의 Pages 미리보기로만 확인하고 **develop에 머지하지 않는다.** 결과는 표로 남기고 스펙 PR로 반영한다(§11).
- 커밋에 `Co-Authored-By`를 남긴다(§3.3). 형식: `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- 모델: 기본 Opus 5.5 · high, 🔺(계약·스키마·권한·동시성·싱크 엔진·초기 골격) Opus 5.5 · xhigh, 스펙 확정과 릴리스 리뷰만 Fable 5.1 · high(스프린트당 1~2회), 조사원 Sonnet 5 · medium(§3.3).
- UI 문구는 한국어(§4.3). 페이지 확대를 막지 않는다(`user-scalable=no` 금지). 드래그 대상에는 처음부터 `touch-action: none`(§4.3).
- 팀 파일(음원·영상)은 기기 밖으로 보내지 않는다(§1.4). **스파이크 테스트 파일은 직접 만든 클릭 트랙만 쓴다.** 상업 음원을 카톡으로 주고받지 않는다.
- 실기기 5개 환경: iOS Safari, iOS 카톡 인앱, Android Chrome, Android 카톡 인앱, 삼성 인터넷(§8). eruda는 미리보기 빌드에만(§8).
- 공개 레포에는 개인 이메일, 비공개 레포 분석, 로그인 테스트로 얻은 타인의 정보를 올리지 않는다(T0-3, T0-4, T14).

## Review Focus

스펙이 암시하지만 어느 태스크의 테스트도 원래 다루지 않던, 사람을 가장 먼저 물 입력·실패 다섯 가지다. 각 줄의 테스트는 해당 태스크에 넣었다.

1. **필수 체크 `ci-ok`가 보고되지 않아 PR이 영원히 머지 불가**(체크 이름 불일치, 트리거 누락) → 기대: 모든 PR에 `ci-ok`가 뜨고, 직접 push는 거부된다. 테스트: T1 Step 9(직접 push 거부), T3 Step 7(`mergeStateStatus`가 `CLEAN`).
2. **스파이크 브랜치가 실수로 develop에 머지됨** → 기대: `spike/*`에서 온 PR은 `ci-ok`가 실패한다. 테스트: T7 Step 9(초안 PR로 확인 후 닫기).
3. **공개 레포로 개인정보·비밀값이 새어 나감**(커밋 이메일 — 특히 GitHub 서버가 만드는 squash·merge 커밋, 조사 원본, 제3자 레포 이름, 키, 로그인 테스트 결과) → 기대: develop·main의 커밋 작성자는 noreply뿐, `docs/research/`와 zip은 추적되지 않음, push protection 켜짐, SP-4 원자료는 커밋하지 않음. 테스트: T0 Step 4(계정 이메일 비공개), T1 Step 6·7·8, T3 Step 7(첫 squash 커밋의 작성자), T14 Step 7.
4. **카톡 인앱 등에서 로그를 못 꺼내 기기 세션 결과가 사라짐**(클립보드 거부) → 기대: 복사·공유·전체 선택 중 하나는 된다. 테스트: T7 Step 8(카톡 "나와의 채팅"으로 열어 확인).
5. **싱크 측정 파이프라인의 오류로 잘못된 결론**(녹화 폰의 자체 어긋남, AAC 프라이밍, 분석 스크립트 버그) → 기대: 알려진 어긋남(+50ms)을 넣은 합성 영상에서 분석기가 그 값을 되찾는다. 테스트: T10 Step 6.

## 조사로 확인한 전제 (2026-09-27)

계획이 기대는 외부 사실이다. "실측"은 이 계획이 직접 확인하는 항목이다.

| 전제 | 근거 | 확인 |
|---|---|---|
| GitHub 조직은 웹에서만 만든다(API·gh 없음) | docs.github.com REST orgs | 공식 |
| 공개 레포는 무료 조직에서도 레포 룰셋이 적용된다. 조직 단위 룰셋(Team 이상)과 다르다 | about-rulesets | 공식 |
| 조직 소유 공개 레포는 secret scanning·push protection이 **기본으로 꺼져 있다** | GitHub changelog 2024-03-11 | 공식 |
| 룰셋 `pull_request.allowed_merge_methods`로 squash만·merge만을 강제한다. `integration_id`는 생략 가능 | REST repos/rules | 공식 |
| `pull_request` 이벤트는 PR 병합 커밋의 워크플로를 쓴다(워크플로를 추가하는 PR도 자기 체크를 낸다) | Actions events 문서 | 공식 |
| claude-code-action@v1 리뷰는 `code-review@claude-code-plugins` 스킬을 prompt로 부른다. 이미 Claude가 댓글을 단 PR은 건너뛴다 → 재리뷰는 로컬 `/code-review` | code.claude.com/docs/en/github-actions, 플러그인 소스 | 공식 |
| 리뷰 워크플로를 **추가·수정하는 PR 자신**에서는 액션이 "workflow validation" 경고만 남기고 코멘트 없이 성공한다(기본 브랜치의 워크플로와 달라서) | claude-code-action `src/github/token.ts` | 공식(소스) |
| GitHub 서버가 만드는 squash·merge 커밋의 작성자는 계정 이메일이다. 로컬 `git config`와 무관하고, 계정의 "Keep my email addresses private"를 켜야 noreply가 된다 | GitHub 문서 setting-your-commit-email-address | 공식 |
| GitHub CLI는 "특권 OAuth 앱"이라 새 조직의 OAuth 앱 접근 제한에 걸리지 않는다 | GitHub 문서 privileged OAuth apps | 공식 |
| 훅 입력 JSON에는 서브에이전트 안에서만 `agent_type`이 들어온다. Windows에서 exec 형식(`command`+`args`)은 셸 없이 실행된다 | hooks.md(요약 읽기) | T4 Step 2 실측 |
| 서브에이전트 frontmatter: `name, description, tools, disallowedTools, model, effort, permissionMode, isolation, hooks…` | sub-agents.md | 공식(요약 읽기) |
| Supabase(GoTrue) 카카오 공급자는 `account_email profile_image profile_nickname`을 **항상** 요청하고, 클라이언트 scopes는 더하기만 한다 → 비즈 앱이 아니면 KOE205 가능성이 크다 | supabase/auth `kakao.go` 소스 | 공식, T11 실측 |
| Supabase 새 프로젝트는 비대칭 JWT(ES256 또는 RS256)가 기본. 정확한 alg는 실측 | Supabase blog | T11 실측 |
| 카카오 로그인 닉네임은 `user_metadata.name`(=`full_name`, `preferred_username`, `user_name`)에 들어간다. `nickname` 키는 없다 | `kakao.go` | 공식 |
| 카카오 콘솔: Redirect URI와 Client Secret은 "앱 설정 > 앱 > 플랫폼 키 > REST API 키" 편집 화면으로 옮겨졌다. 활성화와 동의항목은 "제품 설정 > 카카오 로그인"에 있다 | Supabase auth-kakao 문서 | 공식 |
| supabase-js v2 브라우저 클라이언트의 기본 흐름은 implicit(토큰이 주소 `#`에 실림)이다. 스펙은 흐름을 정하지 않았다. 스파이크는 인앱에서 더 까다로운 `flowType: 'pkce'`(code verifier 보관)로 재고, 흐름 선택은 M1에서 정한다 | supabase-js | 공식 |
| Supabase 리다이렉트 허용 목록의 `*`는 `.`와 `/`를 넘지 못한다 → `https://*.$PAGES.pages.dev/**` | redirect-urls 문서 | 공식 |
| Cloudflare Pages는 2026-09에도 새 프로젝트를 만들 수 있다(Workers 권장 추세는 있음). 브랜치 별칭은 `spike-m0-lab.$PAGES.pages.dev`. 빌드 감시 경로·미리보기 브랜치 규칙 있음. 20커밋 이상 push 등은 감시 경로를 무시하고 빌드한다 | developers.cloudflare.com | 공식 |
| `_headers`가 미리보기 배포에도 적용되는지 | 문서에 없음 | T7 Step 7 실측 |
| Web Locks는 Safari 15.4+·WKWebView 지원(MDN BCD). Wake Lock은 iOS 16.4+ 탭, 18.4+ 홈 화면 앱. `preservesPitch`는 Safari 17.2+(그 전은 `webkitPreservesPitch`) | MDN browser-compat-data | 공식, T8 실측 |
| `kakaotalk://web/openExternal`과 Android intent 탈출은 비공식 | 커뮤니티 자료 | T9 실측 |
| AAC 인코더 프라이밍(1024샘플) 때문에 브라우저마다 소리 시작이 21~46ms 다를 수 있다 | 개발자 보고 | T10 실측 |
| Jira 자동화 "Pull request merged" 트리거는 PR 제목·브랜치·커밋의 키로 연결된 작업에 동작한다. 대상 브랜치 조건 스마트 값은 불안정 보고가 있다 | Atlassian 커뮤니티 | T16 실측 |

---

## 스프린트 1 — 셋업

### Task 0: 👤 사전 결정과 준비 (이슈 없음)

> 👤 사용자 · 🤖 기록 보조 · 약 0.25일 · 레포가 없으므로 이슈를 만들지 않는다

**실무 관점:** 이름(조직·레포·Jira 키·도메인)은 나중에 바꾸기가 가장 비싼 값이다. 특히 Jira 키는 Free에서 사실상 못 바꾼다. 그래서 코드 한 줄보다 먼저 정한다. 공개 레포는 한 번 올린 것을 되돌릴 수 없으므로(포크·캐시), "무엇을 올리지 않을지"도 첫 커밋 전에 정한다.

**Files:** 레포 밖 `~/.kickoff-env`만 만든다.

**Interfaces:**
- Produces: 셸 변수 `NAME, ORG, REPO, KEY, JIRA_SITE, PAGES`(이후 모든 태스크), T0 Step 3·4의 결정(T1, T3 E-01), 기기 세션 날짜(T14)

- [ ] **Step 1 (👤): 서비스 이름과 파생 이름을 정한다**

스펙 §12 첫 항목이다(M0 셋업 전에 정한다). 정한 값을 `~/.kickoff-env`에 적는다.

```bash
cat > ~/.kickoff-env <<'EOF'
export NAME=바꾸기-서비스이름      # 예: KICKOFF. README 제목과 Jira 스페이스 이름에 쓴다
export ORG=바꾸기-조직이름        # GitHub 전체에서 유일. 예: kickoff-crew
export REPO=바꾸기-레포이름       # 예: kickoff
export KEY=바꾸기                 # Jira 키. 대문자 2~10자, 나중에 못 바꾼다고 보고 정한다. 예: KICK
export JIRA_SITE=바꾸기           # <JIRA_SITE>.atlassian.net
export PAGES=바꾸기               # Cloudflare Pages 프로젝트 이름. <PAGES>.pages.dev
EOF
notepad ~/.kickoff-env
```

메모장에서 값을 고치고 **저장하고 닫은 뒤** 확인한다:

```bash
source ~/.kickoff-env && echo "$NAME | $ORG/$REPO | $KEY | $JIRA_SITE | $PAGES" && ! grep -q 바꾸기 ~/.kickoff-env && echo OK
```

Expected: 실제 값 한 줄과 `OK`.

- [ ] **Step 2 (👤): gh 토큰에 project 권한을 더한다**

```bash
gh auth refresh -s project
gh auth status 2>&1 | grep "Token scopes"
```

Expected: 목록에 `'project'`가 있다.

- [ ] **Step 3 (👤): 공개할 문서의 범위를 정한다 — 추천: 조사 원본은 올리지 않고, 인계서의 제3자 레포 이름은 줄인다**

- `docs/research/2026-09-26/`에는 개인 이메일 2개(사용자 본인 것, 멘토 것)와 비공개 레포(이전 앱, 멘토 레포) 분석이 들어 있다. 추천은 **레포에 올리지 않고 PC에만 둔다**(T1 `.gitignore`, T3 E-01).
- 인계서 §5의 "멘토 레포" 항목(`- **멘토 레포:**`와 아래 세 줄)에는 멘토 계정의 레포 이름 2개와 팀 레포 이름이 있다. 추천은 T1 Step 3에서 이 네 줄을 레포 이름 없는 한 줄로 줄여 커밋하는 것이다(멘토에게 공개 허락을 받았다면 그대로 둔다).
- 스펙 머리말과 인계서에 Figma 파일 키가 있다. 키만으로는 열리지 않도록 Figma 공유 설정이 "초대된 사람만"인지 확인한다.
- 인계서·스펙·트리아지에 이메일은 없다(확인함).

- [ ] **Step 4 (👤): 커밋 이메일을 비공개로 한다 — 로컬과 GitHub 계정 둘 다**

지금 전역 git 이메일은 개인 네이버 주소다. 공개 레포의 커밋에는 작성자 이메일이 그대로 남고, 룰셋 때문에 나중에 기록을 고칠 수도 없다.
1. **GitHub 계정:** https://github.com/settings/emails 에서 **Keep my email addresses private**를 켠다. `develop`·`main`에 남는 커밋은 전부 GitHub 서버가 만드는 squash·merge 커밋이고, 그 작성자는 로컬 설정이 아니라 **이 계정 설정**을 따른다. ("Block command line pushes that expose my email"은 켜지 않는다. 전역 git 이메일이 네이버 주소라 다른 레포의 push까지 막힌다.)
2. **로컬:** 이 레포에서만 `<id>+Jongkwang131@users.noreply.github.com`을 쓴다(T1 Step 2).

Jira 스마트 커밋(이메일 일치 필요)은 쓰지 않으므로 잃는 것이 없다. Jira 연결은 이슈 키로만 한다.

- [ ] **Step 5 (👤): 레포 폴더에서 zip을 옮긴다**

`c:\project\KICKOFF`를 그대로 레포로 쓰므로, 946MB `choreography.zip`(비공개 이전 앱)과 `KB_AI_ challenge.zip`을 밖으로 옮긴다. GitHub는 100MB 넘는 파일을 거부하고, 이전 앱은 공개하지 않기로 했다.

```bash
mkdir -p /c/project/_kickoff-archive && mv /c/project/KICKOFF/*.zip /c/project/_kickoff-archive/ && ls /c/project/KICKOFF
```

Expected: `docs`만 보인다. 🤖는 Claude 메모리의 zip 경로 기록을 새 위치로 고친다.

- [ ] **Step 6 (👤): 기기 세션 날짜를 먼저 잡는다**

T14에 필요한 것: 아이폰(Safari·카톡) — **이 가운데 1대는 iOS 26 이하여야 한다**(스펙 §11 SP-3. E1이 iOS 26 이하면 그것으로 충분하다), 안드로이드(Chrome·카톡), 삼성폰(삼성 인터넷), 빌릴 수 있는 가장 오래된 안드로이드, **60fps 녹화용 폰 1대**(가능하면 본인 폰), 유선 이어폰, 블루투스 이어폰 1종. 동아리원에게 빌리고 반나절을 잡는다. 10월 말 시험 기간 전을 권한다. 빌릴 때 **M2(가장 오래된 안드로이드로 50명 문서 확인)와 M4(5개 환경 체크리스트)에 다시 빌릴 수 있는지**도 물어 결과표 기기 줄에 적는다(스펙 §8 "일정은 M0에 잡는다").

- [ ] **Step 7 (👤, 막지 않음): 동아리 확인 두 가지**

겨울방학 연습 일정(파일럿 시점, 스펙 §12)과 **동아리 학교급(중·고·대)**(트리아지 T-08). 답은 T15 스펙 PR의 §12에 적는다. **중학교라는 답이 오면 T15를 기다리지 않고 그날 바로** "만 14세 미만 항목 재트리아지" 이슈를 연다.

---

### Task 1: 레포 부트스트랩 (보호 규칙 전 유일한 직접 push)

> 👤 조직 생성 · 🤖 나머지 · 모델: Opus 5.5 high · 0.5일 · Jira: `S_SETUP`(T2에서 생기므로 커밋에는 키를 붙이지 않는다)

**실무 관점:** 새 레포의 첫 커밋만은 PR 없이 직접 올린다. PR을 받을 브랜치도, PR을 검사할 CI도 아직 없기 때문이다. 그래서 이 커밋에 "PR 흐름이 돌아가는 데 필요한 최소한"(CI 골격, 템플릿, 문서)만 담고, 곧바로 룰셋을 걸어 두 번째 직접 push부터는 막는다. 실무에서도 저장소 관리자가 이렇게 시작한다.

**Files:**
- Create: `.gitignore`, `.gitattributes`, `README.md`
- Create: `.github/workflows/ci.yml`, `.github/pull_request_template.md`, `.github/ISSUE_TEMPLATE/task.yml`, `.github/ISSUE_TEMPLATE/config.yml`
- Create: `docs/ops/github/develop-ruleset.json`, `docs/ops/github/main-ruleset.json`
- Modify(선택): `docs/HANDOFF-2026-09-26.md` §5의 제3자 레포 이름 줄(T0 Step 3)
- 그대로 커밋: `docs/superpowers/specs/2026-09-26-kickoff-v1-design.md`(초안 3판 그대로), `docs/reviews/2026-09-26-external-review-triage.md`, `docs/superpowers/plans/2026-09-27-m0-setup-and-spikes.md`(이 문서)

**Interfaces:**
- Consumes: T0의 `NAME`, `ORG`, `REPO`, T0 Step 3·4의 결정
- Produces: `develop`(기본)·`main`, 룰셋 2개, 필수 체크 이름 `ci-ok`(잡 id), 이슈 폼 `task.yml`, PR 템플릿. T4가 `ci.yml`의 `ci-ok`에 `needs`를 더한다.

- [ ] **Step 1 (👤): 조직을 만든다**

https://github.com/account/organizations/new → **Free** → 이름 `$ORG` → 개인 계정 소유. (조직은 API나 gh로 만들 수 없다.) 확인: `source ~/.kickoff-env && gh api "orgs/$ORG" --jq .login` → `$ORG` 값. (GitHub CLI는 특권 OAuth 앱이라 새 조직의 OAuth 앱 제한에 걸리지 않는다.)

- [ ] **Step 2: 로컬 저장소와 커밋 작성자**

```bash
source ~/.kickoff-env && cd /c/project/KICKOFF
git init -b main
git config user.name "Jongkwang131"
git config user.email "$(gh api user --jq '"\(.id)+\(.login)@users.noreply.github.com"')"
git config user.email
```

Expected: `<숫자>+Jongkwang131@users.noreply.github.com`

- [ ] **Step 3: 저장소 기본 파일을 만든다**

`.gitignore`:

```gitignore
# 의존성·빌드
node_modules/
dist/
build/
.gradle/
# 비밀값
.env
.env.*
!.env.example
# 공개 레포에 올리지 않는 로컬 자료 (T0-3, T0-5)
docs/research/
*.zip
# Claude Code
.claude/settings.local.json
.claude/worktrees/
# 스파이크 산출물 (T8~T10)
spike-assets/
# OS
.DS_Store
Thumbs.db
```

`.gitattributes`:

```gitattributes
* text=auto eol=lf
*.bat text eol=crlf
*.cmd text eol=crlf
*.ps1 text eol=crlf
*.png binary
*.jpg binary
*.mp4 binary
*.m4a binary
*.wav binary
```

`README.md` (제목에 서비스 이름이 들어가도록 셸에서 만든다):

```bash
source ~/.kickoff-env && cd /c/project/KICKOFF && cat > README.md <<EOF
# $NAME

댄스 동아리 리더가 무대 위 포메이션을 만들어 링크 하나로 공유하면, 멤버가 각자 폰에서 자기 동선을 음악에 맞춰 확인하는 웹앱.

- 범위의 원본(스펙): \`docs/superpowers/specs/2026-09-26-kickoff-v1-design.md\`
- 지금 계획: \`docs/superpowers/plans/2026-09-27-m0-setup-and-spikes.md\` (M0 준비·스파이크, 제품 코드 없음)
- 일하는 방식: 이슈 → 브랜치 → PR(→ \`develop\`, squash) → 스프린트 끝 릴리스 PR(→ \`main\`, merge commit). 스펙 §3.3.
EOF
head -1 README.md
```

인계서의 제3자 레포 이름 줄이기(T0 Step 3에서 "줄인다"를 골랐을 때): `docs/HANDOFF-2026-09-26.md` §5의 `- **멘토 레포:**` 줄과 그 아래 세 줄(모두 네 줄)을 다음 한 줄로 바꾼다.

```markdown
- **멘토 레포:** 멘토 프로젝트 2개(Spring·Postgres·영역별 CI·계약 문서 / SDD·모델 배정표)와 팀 레포 1개(정석 보호 규칙, develop 기본 브랜치). 레포 이름은 로컬 조사 원본에만 둔다.
```

확인: 멘토 계정 이름과 팀 조직 이름으로 `grep -c`를 돌려 `0`이 나온다(이 계획서에도 그 이름을 적지 않는다).

- [ ] **Step 4: CI 골격과 템플릿을 만든다**

`.github/workflows/ci.yml`:

```yaml
name: ci

on:
  pull_request:
    # edited: PR의 base를 바꿔도 가드를 다시 돌린다
    types: [opened, synchronize, reopened, edited]

permissions:
  contents: read

jobs:
  # 필수 체크는 이 잡 하나다(스펙 §8). 영역별 잡이 생기면 needs에 넣는다(T4, M1).
  ci-ok:
    if: always()
    runs-on: ubuntu-latest
    steps:
      - name: spike 브랜치는 머지하지 않는다 (스펙 §11)
        if: startsWith(github.head_ref, 'spike/')
        run: |
          echo "::error::spike/* 브랜치는 develop에 머지하지 않는다 (스펙 §11)"
          exit 1
      - name: 릴리스 PR의 head는 이 레포의 develop만 (스펙 §3.3)
        if: github.base_ref == 'main' && (github.head_ref != 'develop' || github.event.pull_request.head.repo.full_name != github.repository)
        run: |
          echo "::error::main으로 가는 PR의 head는 develop이어야 한다 (스펙 §3.3)"
          exit 1
      - run: echo "ci-ok"
```

`.github/pull_request_template.md`:

```markdown
<!-- 제목 형식: <Jira 키> <type>(<범위>): <요약>   예) KICK-3 feat(web): 대형 추가 버튼
     type: feat, fix, docs, chore, ci, test, refactor -->
Closes #

## 무엇을 / 왜

## 확인 방법

## 체크리스트
- [ ] 이슈 1개 = 이 PR 1개, 하루 이하 크기다
- [ ] 스펙과 다르게 동작하는 곳이 없다 (다르면 스펙 PR이 먼저다)
- [ ] 비밀값과 개인정보가 없다
- [ ] 리뷰 스레드는 수정 커밋이나 사유 답글을 단 뒤에만 resolve했다
```

`.github/ISSUE_TEMPLATE/task.yml`:

```yaml
name: 태스크
description: 하루 이하 작업. PR 1개와 짝을 이룬다.
title: "[KEY-?] "
body:
  - type: input
    id: jira
    attributes:
      label: Jira 스토리 키
      description: 제목의 [KEY-?]도 이 키로 바꾼다
      placeholder: KICK-3
    validations:
      required: true
  - type: textarea
    id: goal
    attributes:
      label: 목표
    validations:
      required: true
  - type: textarea
    id: done
    attributes:
      label: 완료 조건
      description: 확인할 수 있는 문장으로 쓴다
    validations:
      required: true
  - type: dropdown
    id: area
    attributes:
      label: 영역
      options: [web, api, contract, docs, infra, spike]
    validations:
      required: true
```

`.github/ISSUE_TEMPLATE/config.yml`:

```yaml
blank_issues_enabled: false
```

- [ ] **Step 5: 룰셋 파일을 만든다**

`docs/ops/github/develop-ruleset.json`:

```json
{
  "name": "develop",
  "target": "branch",
  "enforcement": "active",
  "bypass_actors": [],
  "conditions": { "ref_name": { "include": ["refs/heads/develop"], "exclude": [] } },
  "rules": [
    { "type": "deletion" },
    { "type": "non_fast_forward" },
    {
      "type": "pull_request",
      "parameters": {
        "required_approving_review_count": 0,
        "dismiss_stale_reviews_on_push": false,
        "require_code_owner_review": false,
        "require_last_push_approval": false,
        "required_review_thread_resolution": true,
        "allowed_merge_methods": ["squash"]
      }
    },
    {
      "type": "required_status_checks",
      "parameters": {
        "strict_required_status_checks_policy": false,
        "required_status_checks": [{ "context": "ci-ok" }]
      }
    }
  ]
}
```

`docs/ops/github/main-ruleset.json`:

```json
{
  "name": "main",
  "target": "branch",
  "enforcement": "active",
  "bypass_actors": [],
  "conditions": { "ref_name": { "include": ["refs/heads/main"], "exclude": [] } },
  "rules": [
    { "type": "deletion" },
    { "type": "non_fast_forward" },
    {
      "type": "pull_request",
      "parameters": {
        "required_approving_review_count": 0,
        "dismiss_stale_reviews_on_push": false,
        "require_code_owner_review": false,
        "require_last_push_approval": false,
        "required_review_thread_resolution": false,
        "allowed_merge_methods": ["merge"]
      }
    },
    {
      "type": "required_status_checks",
      "parameters": {
        "strict_required_status_checks_policy": false,
        "required_status_checks": [{ "context": "ci-ok" }]
      }
    }
  ]
}
```

`integration_id`는 넣지 않는다(선택 항목이고, 체크 이름 `ci-ok`는 우리 워크플로만 쓴다). `strict_required_status_checks_policy`는 스펙에 없으므로 `false`로 둔다(1인 squash 흐름에서 "브랜치 최신화" 요구는 마찰만 늘린다).

- [ ] **Step 6: 공개 전 점검 (Review Focus 3)**

```bash
cd /c/project/KICKOFF && git add -A && git status --short
git ls-files | grep -E '\.zip$|^docs/research/|(^|/)\.env' && echo "STOP: 올리면 안 되는 파일" || echo "파일 목록 OK"
git grep -nIE '[A-Za-z0-9._%+-]+@([a-z0-9-]+\.)*(naver\.com|gmail\.com|daum\.net|hanmail\.net|kakao\.com|ac\.kr)' && echo "STOP: 개인 이메일" || echo "이메일 OK"
git grep -nIE 'sb_secret_[A-Za-z0-9_-]{16,}|eyJhbGciOi[A-Za-z0-9_-]{20,}|BEGIN [A-Z ]*PRIVATE KEY-----|sk-ant-[a-z0-9]+-[A-Za-z0-9_-]{20,}' && echo "STOP: 비밀값" || echo "비밀값 OK"
```

Expected: `파일 목록 OK`, `이메일 OK`, `비밀값 OK`. STOP이 하나라도 나오면 원인을 지우고 다시 돈다. (패턴은 실제 키 모양만 잡는다. 이 계획서에 적힌 패턴 문자열 자체는 걸리지 않는다.)

- [ ] **Step 7: 첫 커밋과 작성자 확인**

```bash
git commit -m "chore: 레포 부트스트랩

스펙 초안 3판, 외부 검사 트리아지, 인계서, M0 계획, CI 골격(ci-ok), 이슈·PR 템플릿, 룰셋 정의를 넣는다.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
git log -1 --format='%an <%ae> | %cn <%ce>'
```

Expected: 작성자와 커미터가 모두 `…@users.noreply.github.com`이다. 개인 주소가 보이면 push하기 전에 `git commit --amend --reset-author --no-edit`로 고친다(아직 올리지 않았으니 안전하다).

- [ ] **Step 8: 레포를 만들고, 보안 설정을 먼저 켠 뒤 올린다**

```bash
source ~/.kickoff-env && cd /c/project/KICKOFF
gh repo create "$ORG/$REPO" --public --description "댄스 동아리 포메이션 공유 웹앱 ($NAME)" --source . --remote origin
gh api -X PATCH "repos/$ORG/$REPO" -f 'security_and_analysis[secret_scanning][status]=enabled' -f 'security_and_analysis[secret_scanning_push_protection][status]=enabled' --jq '.security_and_analysis.secret_scanning_push_protection.status'
git push -u origin main
git push origin main:develop
gh repo edit "$ORG/$REPO" --default-branch develop --enable-squash-merge --enable-merge-commit --enable-rebase-merge=false --delete-branch-on-merge
gh api -X PATCH "repos/$ORG/$REPO" -f squash_merge_commit_title=PR_TITLE -f squash_merge_commit_message=COMMIT_MESSAGES --jq .squash_merge_commit_title
gh api "repos/$ORG/$REPO" --jq '{default_branch, allow_squash_merge, allow_merge_commit, allow_rebase_merge, ss: .security_and_analysis.secret_scanning.status, pp: .security_and_analysis.secret_scanning_push_protection.status}'
```

Expected: 두 번째 명령이 `enabled`, 마지막 명령이 `{"default_branch":"develop","allow_squash_merge":true,"allow_merge_commit":true,"allow_rebase_merge":false,"ss":"enabled","pp":"enabled"}`. 보안 설정을 첫 push보다 먼저 켜는 이유: 첫 커밋은 PR과 CI를 거치지 않는 유일한 커밋이다.

squash 커밋 제목은 PR 제목, 본문은 커밋 메시지 모음이다. 그래야 Jira 키가 든 PR 제목이 `develop` 기록에 남고, 커밋의 `Co-Authored-By`도 살아남는다.

- [ ] **Step 9: 룰셋을 걸고 직접 push가 막히는지 확인한다 (Review Focus 1)**

```bash
source ~/.kickoff-env && cd /c/project/KICKOFF
gh api --method POST "repos/$ORG/$REPO/rulesets" --input docs/ops/github/develop-ruleset.json --jq '.id'
gh api --method POST "repos/$ORG/$REPO/rulesets" --input docs/ops/github/main-ruleset.json --jq '.id'
D=$(gh api "repos/$ORG/$REPO/rules/branches/develop" --jq '[.[].type] | sort | join(",")'); M=$(gh api "repos/$ORG/$REPO/rules/branches/main" --jq '[.[].type] | sort | join(",")'); echo "develop=$D"; echo "main=$M"
test "$D" = "deletion,non_fast_forward,pull_request,required_status_checks" && test "$M" = "$D" \
  && git switch -c probe && git commit --allow-empty -m "probe: 보호 규칙 확인" \
  && { git push origin probe:develop; git push origin probe:main; git switch main; git branch -D probe; } \
  || echo "STOP: 룰셋이 두 브랜치에 모두 걸리지 않았다. probe를 push하지 않았다"
```

Expected:
- 룰셋 id 두 개가 출력된다.
- `develop=deletion,non_fast_forward,pull_request,required_status_checks`, `main=` 같은 값.
- 두 push가 모두 `GH013: Repository rule violations found` … `Changes must be made through a pull request`로 거부된다. `STOP`이 나오면 룰셋 생성 오류를 먼저 고친다(룰셋이 없으면 probe가 공개 기록에 들어가므로 push하지 않는다).

비상 탈출(알아만 둔다): 관리자 우회는 없지만 조직 소유자는 Settings → Rules에서 룰셋을 잠시 끌 수 있다(`gh api repos/$ORG/$REPO/rulesets`로 id 확인). 끄면 그 사유를 이슈에 남기고 곧바로 다시 켠다.

- [ ] **Step 10: 로컬 기본 브랜치를 develop으로 맞춘다**

```bash
cd /c/project/KICKOFF && git fetch origin && git switch -c develop --track origin/develop && git log --oneline -1
```

Expected: 부트스트랩 커밋 한 줄. 이후 작업 브랜치는 모두 `develop`에서 딴다.

---

### Task 2: 트래킹 셋업 — Jira(스토리·스프린트) + GitHub(라벨·자동 링크·칸반)

> 👤 Jira 가입·앱 설치·자동화 규칙, 칸반 워크플로 켜기 · 🤖 스토리 만들기(Atlassian MCP), gh 설정 · 모델: Opus 5.5 high · 0.5일 · 레포 파일 변경 없음(PR 없음)

**실무 관점:** "스토리 원본은 Jira, 태스크 원본은 GitHub"(스펙 §3.3). 기획자·PM은 Jira에서 에픽→스토리→스프린트로 **무엇을 왜** 보고, 개발자는 GitHub 이슈·PR로 **어떻게**를 본다. 둘을 잇는 끈은 이슈 제목과 PR 제목의 Jira 키 하나다. 키가 PR 제목에 있으면 GitHub for Atlassian이 Jira 카드에 PR·빌드를 붙여 준다. 같은 내용을 두 곳에 손으로 적지 않는 것이 핵심이다.

**Files:** 없음.

**Interfaces:**
- Consumes: T0의 `KEY`, `JIRA_SITE`, T1의 레포
- Produces: `~/.kickoff-env`의 스토리 키 `S_SETUP, S_SPEC, S_LAB, S_SP1, S_SP2, S_SP3, S_SP4, S_SP5, S_RESULT`, 프로젝트 번호 `PNUM`, 라벨 `model:xhigh`·`model:fable-high`·`spike`

- [ ] **Step 1 (👤): Jira Free 사이트와 스페이스**

1. https://www.atlassian.com/try/cloud/signup 에서 Jira **Free**로 가입한다. 사이트 주소는 `$JIRA_SITE.atlassian.net`.
2. 스페이스(프로젝트) 만들기 → 템플릿 **Scrum** → **Team-managed** → 이름 `$NAME`, 키 `$KEY`.

- [ ] **Step 2: M0 에픽과 스토리**

🤖 Atlassian MCP로 만든다: `getAccessibleAtlassianResources`로 새 사이트의 cloudId를 찾고, `createJiraIssue`로 에픽 1개와 스토리 9개를 만든다. MCP가 새 사이트를 보지 못하면 👤가 웹에서 같은 제목으로 만든다.

| 변수 | 유형 | 제목 | 스프린트 | 태스크 |
|---|---|---|---|---|
| — | 에픽 | M0 준비·스파이크 | — | 전체 |
| `S_SETUP` | 스토리 | 레포·CI·하네스·AI 리뷰·외부 서비스 셋업 | 1 | T1, T4, T5, T6 |
| `S_SPEC` | 스토리 | 외부 검사 트리아지를 스펙에 반영 | 1 | T3 |
| `S_LAB` | 스토리 | 스파이크 랩 뼈대 | 2 | T7 |
| `S_SP1` | 스토리 | SP-1 파일·재생·화면 유지 | 2 | T8 |
| `S_SP2` | 스토리 | SP-2 외부 브라우저로 열기 | 2 | T9 |
| `S_SP3` | 스토리 | SP-3 싱크 정확도 | 2 | T10 |
| `S_SP4` | 스토리 | SP-4 카카오 로그인 | 2 | T11 |
| `S_SP5` | 스토리 | SP-5 손맛(무대·타임라인) | 2 | T12, T13 |
| `S_RESULT` | 스토리 | 기기 세션·결과표·스펙 갱신(SP-6 포함) | 2 | T14, T15 |

스토리는 모두 에픽의 하위로 둔다. 🤖가 받은 키를 표 순서대로 바로 적는다(아래 `KICK-2 …`는 예시이고 실제 받은 키로 바꿔 실행한다):

```bash
printf 'export S_SETUP=%s S_SPEC=%s S_LAB=%s S_SP1=%s S_SP2=%s S_SP3=%s S_SP4=%s S_SP5=%s S_RESULT=%s\n' KICK-2 KICK-3 KICK-4 KICK-5 KICK-6 KICK-7 KICK-8 KICK-9 KICK-10 >> ~/.kickoff-env
source ~/.kickoff-env && echo "$S_SETUP $S_SPEC $S_RESULT"
```

Expected: Jira 화면의 키와 같은 값 세 개.

- [ ] **Step 3 (👤): 스프린트**

백로그에서 스프린트 1(1주)에 `S_SETUP`, `S_SPEC`를, 스프린트 2에 나머지를 넣는다. 스프린트 1을 시작한다.

- [ ] **Step 4 (👤): GitHub for Atlassian 연결**

Jira → Apps → Explore more apps → **GitHub for Atlassian** → Get app → Get started → GitHub Cloud → 조직 `$ORG`의 **소유자로** Connect → All repositories. Apps → Manage your apps에서 `$ORG`가 연결됨으로 보이면 끝이다.

- [ ] **Step 5 (👤): Jira 자동화 규칙 하나 — "릴리스 PR 머지 → 스토리 완료"**

스페이스 설정 → Automation → Create rule:
1. Trigger: **Pull request merged**
2. Condition: **{{smart values}} condition** — 첫 값 `{{pullRequest.destinationBranch}}`, 조건 `equals`, 둘째 값 `main`
3. Action: **Transition work item** → `Done`
4. 이름 `릴리스 PR 머지 → 스토리 완료`, 켜기

feature→develop PR에도 트리거는 돌지만 조건에서 걸러진다. 실제 동작은 T16 첫 릴리스에서 확인한다. 2026-12-03부터 자동화가 단계(step) 단위로 계량되므로, 그 전에 Free 한도를 Jira 가격 페이지에서 확인한다.

- [ ] **Step 6: 라벨과 자동 링크**

```bash
source ~/.kickoff-env
gh label create "model:xhigh" --repo "$ORG/$REPO" --color B60205 --description "🔺 Opus 5.5 xhigh로 작업 (스펙 §3.3)"
gh label create "model:fable-high" --repo "$ORG/$REPO" --color 5319E7 --description "Fable 5.1 high 리뷰 슬롯 (스펙 확정·릴리스)"
gh label create "spike" --repo "$ORG/$REPO" --color FBCA04 --description "버리는 스파이크. develop에 머지하지 않는다"
gh api -X POST "repos/$ORG/$REPO/autolinks" -f key_prefix="$KEY-" -f url_template="https://$JIRA_SITE.atlassian.net/browse/$KEY-<num>" -F is_alphanumeric=false --jq '.key_prefix'
```

Expected: 라벨 3개 생성 메시지, 마지막 줄에 `KEY-`(실제 키) 출력.

- [ ] **Step 7: GitHub Projects 칸반**

```bash
source ~/.kickoff-env
PNUM=$(gh project create --owner "$ORG" --title "$NAME 개발" --format json --jq .number)
gh project link "$PNUM" --owner "$ORG" --repo "$ORG/$REPO"
echo "export PNUM=$PNUM" >> ~/.kickoff-env && echo "$PNUM"
```

👤 프로젝트 화면 → ⋯ → Workflows에서 켠다: **Item added to project**(Status=Todo), **Auto-add to project**(필터 `is:issue,pr`), **Item closed**(Done), **Pull request merged**(Done). 자동 추가는 T3의 이슈 #1이 보드에 저절로 올라오는지로 확인한다. 올라오지 않으면(무료 조직 한도) 이슈마다 `gh project item-add "$PNUM" --owner "$ORG" --url <이슈 URL>`을 쓴다.

---

### Task 3: [이슈 #1] 외부 검사 트리아지를 스펙에 반영 (첫 스펙 PR)

> 👤 사용자 + 🤖 오케스트레이터 · 모델: Opus 5.5 high(편집), 리뷰는 Fable 5.1 high 1회(스펙 변경 = "스펙 확정" 슬롯) · 0.5~1일 · Jira: `S_SPEC`

**실무 관점:** 스펙은 확정 문서라 "고쳐 달라"로 바로 고치지 않는다. 이슈(왜 바꾸나) → 브랜치 → PR(무엇을 바꿨나) → 리뷰 → squash 머지 순서로만 바꾼다. 나중에 "이 규칙 언제 왜 바뀌었지?"를 `git log -p` 한 번과 PR 한 개로 답할 수 있게 하는 것이 목적이다. choreography에서 스펙이 42분 동안 7번 바뀐 것을 막는 장치가 바로 이 흐름이다.

**Files:**
- Modify: `docs/superpowers/specs/2026-09-26-kickoff-v1-design.md` (아래 E-01~E-59. 줄 번호는 초안 3판 = 부트스트랩 커밋 기준이며, 찾을 문장으로 위치를 확인한다)
- 읽기 전용 근거: `docs/reviews/2026-09-26-external-review-triage.md` (T-01~T-11)

**Interfaces:**
- Consumes: Task 1의 `develop`·룰셋·`ci-ok`, Task 2의 Jira 스토리 키 `S_SPEC`·라벨 `model:fable-high`
- Produces: 스펙 "초안 3판 + 트리아지" 판. 이후 모든 태스크(특히 Task 8 SP-1의 `FILE_MATCH_TOLERANCE_MS`, Task 12·13 SP-5 항목, Task 15 결과 PR)가 이 판을 기준으로 삼는다. 새 계약 이름: Problem type `project-not-found`.

- [ ] **Step 1: 이슈 만들기**

```bash
source ~/.kickoff-env
gh issue create --repo "$ORG/$REPO" --title "[$S_SPEC] 외부 검사 트리아지를 스펙에 반영" --label "model:fable-high" --body-file - <<'EOF'
## 목표
외부 종합 검사(77/100) 트리아지 결과(`docs/reviews/2026-09-26-external-review-triage.md`, 2026-09-26 사용자 승인)를 스펙에 반영한다.

## 범위
- [ ] T-01 팀 파일 길이 확인
- [ ] T-02 대형 끼워 넣기 Must
- [ ] T-03 좌표 반올림·문서 크기
- [ ] T-04 형식 번호 규칙
- [ ] T-05 버리는 버튼 확인
- [ ] T-06 A9 조건
- [ ] T-07 반복 401 기록
- [ ] T-08 개인정보
- [ ] T-09 그리기 순서
- [ ] T-10 보안·운영 한 줄들
- [ ] T-11 테스트·파일럿

## 완료 조건
- 스펙 PR이 squash 머지되고 이 이슈가 자동으로 닫힌다.
- 트리아지 §1의 모든 항목이 스펙 어딘가에 대응한다(PR 본문 대응표).
EOF
```

Expected: `https://github.com/<ORG>/<REPO>/issues/1` 출력. 이 이슈가 칸반(T2 Step 7)에 Todo로 저절로 올라왔는지 본다.

- [ ] **Step 2: 브랜치**

```bash
cd /c/project/KICKOFF && git switch develop && git pull --ff-only && git switch -c docs/1-review-triage
```

- [ ] **Step 3: 아래 편집 E-01~E-59를 적용한다**

각 항목은 "찾을 문장(앞부분)" → "바꿀 내용"이다. `[추가]`는 찾은 줄 **바로 뒤에** 새 줄을 넣는다는 뜻이다. 표 행을 바꿀 때는 행 전체를 교체한다. 인라인 코드 안의 백슬래시-백틱(`` \` ``)은 백틱 한 개를 뜻한다(스펙에 백슬래시를 넣지 않는다. Step 4가 확인한다). 펜스 블록은 이 목록 안에 들어 있어 줄마다 앞에 공백 2칸이 붙어 있다. 그 2칸만 빼고 넣는다(E-09·E-45·E-51은 최상위 불릿, E-22는 2칸 하위 불릿이 된다).

**머리말**

- **E-01 (공개 레포 결정, Task 0 Step 3)** L7 `  - \`docs/research/2026-09-26/\` (조사 원본)` →
  `  - \`docs/research/2026-09-26/\` (조사 원본. 개인 이메일과 비공개 레포 분석이 들어 있어 공개 레포에 올리지 않고 작성자 PC에만 둔다)`
  (Task 0 Step 3에서 "조사 자료도 공개"를 골랐다면 이 항목은 건너뛴다.)
- **E-02 (변경 이력)** L14 `  - 초안 3판 보완: §7.2만 좁게 다시 확인해, ...` [추가]
  `  - 외부 검사 트리아지 반영(\`docs/reviews/2026-09-26-external-review-triage.md\`, 이슈 #1): 팀 파일 길이 확인, 대형 끼워 넣기 Must 승격, 좌표 반올림, 형식 번호 규칙, 버리는 버튼 확인, A9 조건, 반복 401 기록, 리더 이름 비공개, 그리기 순서, 보안·운영 보강, 테스트·파일럿 보강.`

**§2 범위**

- **E-03 (T-02)** L77 `| M-07 | 대형 추가·삭제 | ...` →
  `| M-07 | 대형 추가(끼워 넣기 포함)·삭제 | 추가하면 선택 대형을 복사한다. 선택 대형이 마지막이면 뒤에 붙이고, 아니면 다음 대형과의 사이에 끼워 넣는다(§7.3). 삭제할 때는 확인 창을 띄운다. 첫 대형은 삭제할 수 없다. 최대 200개 |`
- **E-04 (T-01)** L78 `| M-08 | 로컬 팀 파일 불러오기 | 영상과 음원 모두 받는다. 30분 이하만 받는다 |` →
  `| M-08 | 로컬 팀 파일 불러오기 | 영상과 음원 모두 받는다. 30분 이하만 받는다. 길이 불일치 경고·확인(§7.4) |`
- **E-05 (T-01)** L101 `| S-07 | 팀 파일 자동 일치 확인 (E4) | ...` →
  `| S-07 | E4: 길이가 같은 편집본 구분 | 길이 확인(§7.4). 이름·크기·지문 비교는 하지 않는다. 전송 중에 이름이 바뀌고 재인코딩되기 때문이다 |`
- **E-06 (T-08)** L113 `| S-19 | 작품 삭제 | — |` →
  `| S-19 | 작품 삭제 | 파일럿 중에는 요청이 오면 운영자가 수동으로 지운다(§9.4) |`
- **E-07 (T-02)** L124 `- 대형 복제, 대형 이름 변경, 시간 숫자 입력, 대형 사이 끼워 넣기` →
  `- 대형 복제, 대형 이름 변경, 시간 숫자 입력`

**§3 아키텍처**

- **E-08 (T-08 백업 리전)** L190 백업 줄의 `비공개 S3에 올린다.` → `비공개 S3(서울 리전 ap-northeast-2)에 올린다.` (뒤 문장은 그대로)
- **E-09 (T-10)** L191 `  - 백업 감시: ...` 블록 [추가]
  ```
  - **컨테이너와 방화벽:** Spring 컨테이너 포트는 publish하지 않고, Caddy가 Docker 네트워크로 접근한다. 포트가 열리면 Caddy에서만 하는 1MB 검사(§6 규칙 7)를 우회할 수 있기 때문이다. Lightsail 방화벽은 IPv4·IPv6 모두 22·80·443만 연다.
  - **로그와 디스크:** Docker 로그를 순환한다(`max-size 10m`, `max-file 3`). 배포 끝에 `docker image prune -f`를 실행한다.
  - **이미지와 롤백:** 이미지는 커밋 SHA로 태그한다. 교체 뒤 `/api/health`가 실패하면 배포 잡을 실패로 끝낸다. 롤백은 이전 SHA를 다시 배포하는 것이다. 단, 문서 형식 번호 `v`를 올린 릴리스(§5.5)는 롤백하지 않고 수정 릴리스로 고친다.
  - **운영 감시:** 운영 keep-alive가 성공하면 healthchecks.io의 두 번째 체크에 핑을 보낸다. 운영이 다운되면 운영자에게 알림이 간다.
  ```
  그리고 주기는 한 곳에만 두기 위해(§0), L189 `  - keep-alive: 운영과 스테이징 **둘 다** …` 줄 끝에 ` 운영은 파일럿 전에 1시간 주기로 바꾼다.`를 붙인다.

**§4 화면**

- **E-10 (T-08)** L221 ④ 행의 `댄서 추가·이름 수정.` →
  `댄서 추가·이름 수정(이름 입력칸 힌트: "링크를 받은 누구나 볼 수 있어요. 별명도 괜찮아요").`
- **E-11 (T-08)** L222 ⑤ 행의 `"링크가 있으면 누구나 로그인 없이 볼 수 있어요(편집 불가)"` →
  `"링크가 있으면 누구나 로그인 없이 제목과 댄서 이름을 볼 수 있어요(편집 불가)"`
- **E-12 (T-08, T-01)** L223 ⑥ 행 내용 칸을 다음으로 교체:
  `카톡 인앱 배너(인앱일 때만). 제목과 댄서 미리보기. **리더 파일의 길이(m:ss)와 이름**(길이를 이름보다 눈에 띄게. 기기마다 이름이 달라질 수 있다), 없으면 "리더가 아직 팀 파일을 정하지 않았어요". [팀 파일 고르기](문구는 §1.4). [파일 없이 보기]. 하단에 처리방침 링크`
  (삭제되는 것: `"리더 ○○의 작품".`)
- **E-13 (T-06)** L227 조회 실패 행 데이터 칸 `네트워크·5xx·429·시간 초과` →
  `네트워크·5xx·429·시간 초과, 조회(GET)에서 \`project-not-found\`가 아닌 404`
- **E-14 (T-05)** L228 E2 행 내용 칸의 `덮어쓰기에는 "다른 기기에서 저장한 내용이 사라져요" 확인` →
  `불러오기에는 "이 기기에서 한 변경이 사라져요", 덮어쓰기에는 "다른 기기에서 저장한 내용이 사라져요" 확인`
- **E-15 (T-05)** L231 저장 불가 행 내용 칸 `배너: "이 변경은 저장할 수 없어요" + [서버 버전 불러오기]` →
  `배너: "이 변경은 저장할 수 없어요" + [서버 버전 불러오기]. 불러오기에는 "이 기기에서 한 변경이 사라져요" 확인`
- **E-16 (T-01 파생: §4.1 화면 목록 정합성)** L232 `| 다른 창에서 열림 | M-03 |` 행 [추가] (§7.2.2의 같은 이름 행이 아니다)
  `| 팀 파일 길이 불일치 | M-08 | 에디터는 확인 창, 뷰어(⑥·⑧)는 재생을 막지 않는 배너. 규칙과 문구는 §7.4 | 파일 \`duration\`, \`teamFile\` |`
- **E-17 (T-06)** L233 작품 없음 행 데이터 칸 `404` → `404 \`project-not-found\``
- **E-18 (T-09)** L251 `- **"나는 누구" 강조:** ...` [추가]
  `- **그리기 순서:** 토큰은 \`dancers\` 배열 순서로 그리고, 터치는 맨 위에 그려진 토큰이 받는다. **뷰어는 내 토큰을 맨 마지막에(맨 위에) 그린다.** 내 동선이 다른 토큰 밑에 묻히지 않게 하기 위해서다.`

**§5 데이터 모델**

- **E-19 (T-08)** L270 `  display_name  text NOT NULL,             -- 카카오 닉네임 (§6 규칙 3)` 줄을 **지운다**. (`app.app_user`는 `id`, `created_at` 두 칸이 된다.)
- **E-20 (T-03)** L309 좌표계 행의 `(\`x < 1/cols\` 또는 \`x > 1 − 1/cols\`)` →
  `(\`x < 1/cols − 1e-4\` 또는 \`x > 1 − 1/cols + 1e-4\`. 경계선 위는 무대다. 좌표 반올림(§7.3) 오차가 최대 5e-5이므로 여유값은 그보다 커야 한다. 1e-6이면 cols가 9, 11, 12, 13, 14, 17, 19, 21일 때 경계 토큰이 백스테이지로 뒤집힌다)`
- **E-21 (T-03)** L320 `- **크기:** ...` 줄 전체 →
  `- **크기:** 상한을 꽉 채운 문서(50명 × 200개, 24열, 이름 20자)의 PUT 본문은 좌표가 무한소수이면 최대 약 0.93MB다(실측). 좌표를 소수 4자리로 반올림하므로(§7.3) 약 0.67MB이고, 요청 한도(1MB = 10^6바이트, §6 규칙 7) 안에 든다.`
- **E-22 (T-04)** L336 `  - 판 올림 함수마다 테스트를 둔다.` [추가]
  ```
    - **필드를 추가할 때는 선택 필드라도 `v`를 올린다.** 옛 번들은 자기가 아는 판보다 높은 `v`를 받으면 편집을 막으므로(위) 모르는 필드를 지우지 않는다. `v`를 올리지 않으면 옛 번들이 모르는 필드를 조용히 지우는 데이터 손실 경로가 생긴다.
    - `v`를 올리는 릴리스는 다음 두 가지를 테스트와 함께 포함한다.
      1. 프론트 판 올림 함수: 기기 저장소 항목(`content`, `lastSent`)과 받은 문서를 편집·비교하기 전에 최신 판으로 올린다.
      2. 서버의 "같은 내용이면 200" 판정(§6 규칙 5)도 저장본의 판을 올린 뒤 비교한다. 그 릴리스의 마이그레이션으로 행을 미리 올려도 된다.
  ```
- **E-23 (T-04)** L338 `  - 대형 이름·메모·색: 문서의 선택 필드로 추가한다.` →
  `  - 대형 이름·메모·색: 문서의 선택 필드로 추가하고 \`v\`를 올린다.`

**§6 API 계약**

- **E-24 (T-08)** L353 `| 누구나 | \`GET /api/share/{token}\` | 200 \`{title, ownerName, content}\` |` →
  `| 누구나 | \`GET /api/share/{token}\` | 200 \`{title, content}\` |`
- **E-25 (T-06)** L359 규칙 2 끝 `남의 작품이거나 없는 작품이면 **404**를 돌려준다(403이 아니다. 존재 여부를 숨긴다).` →
  `남의 작품이거나 없는 작품이면 **404**를 돌려준다(403이 아니다. 존재 여부를 숨긴다). 이 404의 Problem type은 \`project-not-found\`다. 클라이언트는 이 type일 때만 "작품 없음"으로 판단한다(§7.2.3 A9).`
- **E-26 (T-08)** L360~363 규칙 3 전체(하위 줄 3개 포함) →
  `3. **사용자 등록:** \`POST /api/projects\`를 처리할 때 \`app_user(id)\`를 upsert한다. 가입 API는 따로 두지 않는다. 앱 DB에는 이름을 두지 않는다.`

**§7 흐름**

- **E-27 (T-08)** L384 `2. **받는 정보:** 앱 DB(\`app\` 스키마)에는 **닉네임만** 둔다.` →
  `2. **받는 정보:** 앱 DB(\`app\` 스키마)에는 이름을 두지 않는다. 사용자 id만 둔다.`
- **E-28 (T-05)** L442 A5 행 →
  `| A5 | E2 [최신 버전 불러오기] | "이 기기에서 한 변경이 사라져요"를 확인받는다. [취소]면 E2에 머문다. 확인하면 **적용**한다: 현재 문서 = 서버 content, \`baseRevision = revision\`, \`pending = false\`, 기기 저장소 항목을 지운다. 대기 중인 저장과 타이머는 버린다 |`
- **E-29 (T-05)** L444 A7 행의 `[서버 버전 불러오기]를 누르면 \`GET /api/projects/{id}\`의 \`{revision, content}\`로 A5를 한다.` →
  `[서버 버전 불러오기]를 누르면 "이 기기에서 한 변경이 사라져요"를 확인받는다([취소]면 저장 불가에 머문다). 확인하면 \`GET /api/projects/{id}\`의 \`{revision, content}\`로 A5의 **적용**을 한다(확인은 다시 묻지 않는다).`
- **E-30 (T-06)** L446 A9 행 →
  `| A9 | 404이면서 Problem type이 \`project-not-found\` | 기기 저장소 항목(현재 사용자의 키)을 지운다. 에디터에 있으면 "작품을 찾을 수 없어요"를 띄우고 ①로 간다. **그 밖의 404(본문 없음, 다른 type)는 A10이다.** 배포 실수로 라우트가 404를 내도 미전송 변경을 지우지 않기 위해서다 |`
- **E-31 (T-06)** L447 A10 행 이벤트 칸 `네트워크 오류 · 5xx · 시간 초과(보낸 뒤 15초, \`AbortSignal.timeout\`)` →
  `네트워크 오류 · 5xx · 시간 초과(보낸 뒤 15초, \`AbortSignal.timeout\`) · A9가 아닌 404`
- **E-32 (T-06)** L462 `2. **서버본:** \`GET /api/projects/{id}\`. 404면 A9, 401이면 §7.6 "로그인 만료", 그 밖의 실패면 조회 실패 화면(§7.6)이다.` →
  `2. **서버본:** \`GET /api/projects/{id}\`. \`project-not-found\` 404면 A9, 401이면 §7.6 "로그인 만료", 그 밖의 실패(다른 404 포함)면 조회 실패 화면(§7.6)이다.`
- **E-33 (T-07)** L477 `- **쓰기 실패 중의 변경은 이 창의 메모리에만 있다.** ...` [추가]
  `- **갱신한 뒤에도 PUT이 401이면(A8)** 서버 인증 설정 문제(JWKS·알고리즘·iss/aud)일 가능성이 크다. 재로그인으로는 풀리지 않으므로 E3로 두고 10초마다 갱신·재시도한다(A10). 서버를 고치면 저절로 저장된다. 이때 E3 문구의 "인터넷" 안내는 사실과 다르다. 갱신 요청이 429를 받으면 supabase-js가 세션을 지워 \`SIGNED_OUT\`이 될 수 있고, 그러면 §7.1대로 L0로 간다.`
- **E-34 (T-02)** L492~497 `- **대형 추가:**` 블록 전체(하위 줄 5개 포함) →
  ```
  - **대형 추가:** S = 선택 대형, N = S의 다음 대형으로 둔다.
    - 최대 200개이고, 200개면 [+대형]을 끈다.
    - **N이 없으면(S가 마지막 대형) 뒤에 붙인다.** S를 복사하고 새 id를 붙인다.
      - 템포가 있으면 `b = beat(S.startMs)`로 두고, `startMs = gridMs(b+8)`, `transitionInMs = gridMs(b+8) − gridMs(b+6)`(2카운트)이다.
      - 템포가 없으면 `startMs = S.startMs + 4000`, `transitionInMs = 1000`이다.
      - 새 startMs가 1,800,000을 넘으면 [+대형]을 끈다.
    - **N이 있으면 S와 N 사이에 끼워 넣는다.** S를 복사하고 새 id를 붙여 S 바로 뒤에 넣는다(X).
      - `E = N.startMs − N.transitionInMs`로 둔다. `E − S.startMs < 2`이면 [+대형]을 끈다.
      - `X.startMs`는 `(S.startMs + E)/2`를 블록 드래그와 같은 스냅(아래 "타임라인 블록")에 붙인 뒤 `[S.startMs + 1, E − 1]`로 클램프한 값이다. 상한을 `E − 1`로 두는 이유는 추가 직후 플레이헤드가 N의 이동 구간 잠금에 걸리지 않게 하기 위해서다.
      - `X.transitionInMs`는 템포가 있으면 `min(X.startMs − gridMs(beat(X.startMs) − 2), X.startMs − S.startMs)`, 없으면 `min(1000, X.startMs − S.startMs)`다.
      - N의 값은 바꾸지 않는다. X가 S의 복사본이므로 재생 결과는 추가 전과 같다.
  ```
- **E-35 (T-03)** L498 `- **토큰 드래그:** ...` [추가]
  `- **드래그 중에는 문서를 바꾸지 않는다:** 토큰·블록·핸들을 드래그하는 동안에는 화면 상태로만 움직이고, 손을 뗄 때 문서를 한 번만 바꾼다(A1은 그때 한 번). 댄서 이름도 확정(blur·Enter)할 때만 반영한다.`
- **E-36 (T-03)** L504~506 `- **정수화:**` 블록 →
  ```
  - **정수화와 반올림:**
    - 문서에 쓰는 모든 시간은 쓰기 직전에 `Math.round`로 정수 ms로 만든다. 격자 시각, 미디어의 `currentTime`·`duration`이 여기에 해당한다.
    - 문서에 쓰는 모든 좌표(스냅 결과, 댄서 추가 위치)는 쓰기 직전에 `Math.round(v * 1e4) / 1e4`로 만든다.
    - 입력칸의 값은 유효할 때만 문서에 반영한다.
  ```
- **E-37 (T-01)** L520 `- **teamFile 기록:** ...` 줄 전체 →
  ```
  - **teamFile 기록과 길이 확인:** 파일을 불러온 뒤 `d = Math.round(duration · 1000)`으로 둔다. 허용 오차 상수 `FILE_MATCH_TOLERANCE_MS`는 500이고 SP-1 결과로 조정한다. "차이"는 `|d − teamFile.durationMs|`다.
    - **에디터(리더):**
      - `teamFile`이 null이면 `{name, durationMs: d}`로 기록한다(편집으로 취급해 자동 저장).
      - 차이가 허용 오차 이하이면 `teamFile`을 바꾸지 않는다. 이름만 다른 경우도 포함된다.
      - 차이가 허용 오차보다 크면 확인 창을 띄운다: "지금 정한 팀 파일(m:ss)과 길이가 달라요(m:ss). 바꿔도 대형 시간과 1-1은 그대로예요. 이 파일로 바꿀까요?" [바꾸기]면 `teamFile`을 `{name, durationMs: d}`로 갱신한다. [취소]면 고른 파일을 버리고 `teamFile`을 유지한다.
      - 리더가 편집본을 바꿀 때 확인 없이 덮어쓰면 뷰어 경고가 틀린 파일을 "일치"로 통과시키므로 이 확인을 둔다.
    - **뷰어(멤버):** 고른 파일은 문서를 바꾸지 않는다. `teamFile`이 있고 차이가 허용 오차보다 크면 재생을 막지 않는 배너를 띄운다: "리더 파일(m:ss)과 길이가 달라요(이 파일 m:ss). 팀에서 정한 파일인지 확인해 주세요". 파일을 구하는 방법은 말하지 않는다(§1.4). `teamFile`이 null이면 비교하지 않는다.
    - **한계:** 길이가 같은 다른 편집본은 잡지 못한다(S-07).
  ```
- **E-38 (T-06)** L558 `| 에디터에서 작품 404 | §7.2.3 A9 |` →
  `| 에디터에서 작품 404 | \`project-not-found\`이면 §7.2.3 A9. 그 밖의 404는 PUT이면 A10, GET이면 조회 실패 |`
- **E-39 (T-06)** L560 조회 실패 행 처리 대상 칸 `404를 뺀 모든 실패` →
  `위 두 404 행(작품 404, 공유 링크 404)에 해당하지 않는 모든 실패`

**§8 테스트**

- **E-40 (T-01·T-02·T-03)** L570 단위(web) 도메인 행 대상 칸 끝(`...계약 스키마 검증을 통과해야 한다**`) 뒤에 이어 쓴다:
  `. **팀 파일 길이 확인:** 차이 500이면 경고 없음, 501이면 경고. \`teamFile\`이 null이면 비교하지 않음. 에디터에서 차이가 허용 오차 이하이면 \`teamFile\` 불변. **대형 끼워 넣기:** N.transitionInMs=0, \`E − S.startMs\`가 1(버튼 꺼짐)과 2(X.startMs = S.startMs+1), 템포 있음·없음, 추가 직후 플레이헤드 위치에서 편집 잠금이 없는지. **좌표:** cols=21에서 경계선 위 토큰은 무대다. 반올림 뒤 좌표는 소수 4자리 이하다.`
- **E-41 (T-05·T-06·T-07)** L571 자동 저장 행 대상 칸의 `가짜 signOut 오류 → ① 유지.` 뒤에 이어 쓴다:
  ` E2 [최신 버전 불러오기]·저장 불가 [서버 버전 불러오기]의 확인 창에서 [취소] → 상태·문서·항목 불변. 본문 없는 404 → 항목 유지 + E3. A8 갱신 뒤 재전송은 갱신된 토큰을 싣는다(가짜 API가 받은 Authorization 확인).`
- **E-42 (T-03·T-06)** L572 통합 행 대상 칸의 `**§5.3 상한을 꽉 채운 문서가 1MB 안에 들어 저장된다.**` →
  `**§5.3 상한을 꽉 채운 문서가 1MB 안에 들어 저장된다**(최악 문서: 좌표 7자(예: \`-0.0417\`), 댄서 이름 20자 한글, \`teamFile\` 이름 200자 한글). 작품 404의 Problem type이 \`project-not-found\`다.`
- **E-43 (T-11)** L574 E2E 행: 대상 칸 끝에 `. 뷰어를 열기 전에 "저장됨 ✓"을 기다린다`를 붙이고, 시점 칸 `develop 배포 후. 머지를 막지 않는다` →
  `develop 배포 후. PR 머지는 막지 않는다. M4부터 release PR은 그 develop 커밋의 스모크가 통과한 뒤에만 머지한다(체크리스트 규칙, 필수 체크 아님)`
- **E-44 (T-11)** L575 실기기 행 대상 칸 전체 →
  `파일 고르기, 재생, **싱크(3분 곡 전곡, ±50ms: 아래 정의)**, Wake Lock(자동 잠금을 30초로 맞추고 음원 전용 파일로 1분 넘게), 드래그, **댄서 50명으로 드래그·재생이 끊기지 않는지**(상한 문서(통합 테스트 픽스처 재사용)를 열어 토큰 하나를 옮기고 "저장됨"까지 걸린 시간을 기록한다. 기기는 빌린 것 중 가장 오래된 안드로이드. **M2 안에 끝낸다.** 상한을 낮춰야 한다면 저장된 문서가 생기기 전이어야 한다), **현실 크기 문서(20명 × 40대형)로 편집 직후 탭 닫기 → 같은 브라우저로 다시 열기 → 저장됨**(keepalive 60KB 한도를 현실 문서도 넘기 때문), 카톡 배너`
  그리고 L577 `- **실기기 5개 환경:** ...` 줄 [추가]
  `- **싱크 ±50ms의 정의:** 각 측정 시점에서 \`|화면에 그린 시각 − 들린 시각| ≤ 50ms\`다. 기준은 기기 내장 스피커 또는 유선 이어폰이다. 블루투스 이어폰 1종은 같은 방법으로 재서 참고값으로만 기록한다(S-17 판단용). 측정 절차는 M0 계획(SP-3)을 따른다.`

**§9 보안과 개인정보**

- **E-45 (T-10)** L625 `- **검색 비노출:** ...` [추가]
  ```
  - **보안 헤더:** Cloudflare Pages `_headers`의 `/*`에 `Referrer-Policy: strict-origin-when-cross-origin`, `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`를 넣는다. 전체 CSP는 보류한다(eruda가 `unsafe-inline`을 요구하고, 5개 환경을 다시 확인해야 한다. 파일럿 뒤에 트리아지한다).
  - **API 헤더:** Spring Security 기본 보안 헤더(Cache-Control 등)를 끄지 않는다. 공개 경로는 `web.ignoring()`이 아니라 `permitAll`로 연다.
  ```
- **E-46 (T-08)** L630 `- **이용 대상:** 만 14세 이상이다. ...` 줄 끝에 이어 쓴다:
  ` 만 14세 미만 리더임을 알게 되면 회원 탈퇴 절차(아래)로 계정과 작품을 삭제한다. 만 14세 미만 댄서의 이름은 리더에게 별명으로 바꾸거나 지우도록 요청한다.`
- **E-47 (T-08)** L634 `      - 카카오가 제공하고 리더가 동의한 경우: 이메일, 프로필 사진 URL. Supabase Auth에 저장되고, 앱 DB에는 닉네임만 둔다(§7.1).` →
  `      - 카카오가 제공하고 리더가 동의한 경우: 이메일, 프로필 사진 URL. 필수 항목과 함께 Supabase Auth에 저장된다. 앱 DB에는 사용자 id만 둔다(§7.1).`
- **E-48 (T-10)** L635 `  - **접속 기록:** ...` 줄 [추가]
  `    - Caddy·Tomcat 접근 로그는 켜지 않는다. 켜거나 외부 로그·오류 추적 서비스를 붙이려면 이 처리방침(접속 기록, 처리 위탁)을 먼저 고치고, \`/s/\`·\`/api/share/\` 경로의 토큰을 가린다.`
- **E-49 (T-08)** L636 `**공유 링크를 가진 누구에게나 제목, 리더 닉네임, 댄서 이름이 보인다.**` →
  `**공유 링크를 가진 누구에게나 제목과 댄서 이름이 보인다.**`
- **E-50 (T-08)** L639 처리방침 항목 안의 `정보주체의 권리와 행사 방법(탈퇴·열람 요청 이메일과 처리 기한)` →
  `정보주체의 권리와 행사 방법(탈퇴·열람·정정·삭제·처리정지 요청 이메일과 처리 기한. 작품에 이름이 들어간 사람(비회원 포함)도 같은 이메일로 요청할 수 있고, 요청하면 수집 출처(리더 입력)와 목적을 알린다)`
- **E-51 (T-08)** L645 `  4. Supabase 사용자를 삭제한다.` [추가]
  ```
  - **파일럿 중 수동 운영 절차:**
    - 댄서 이름 정정·삭제 요청: 먼저 리더에게 ④에서 고치도록 요청한다. 리더가 응하지 않으면 운영자가 `content`의 이름을 바꾸고 revision을 +1 한다. revision을 올리지 않으면 리더의 자동 저장이 정정을 되돌린다.
    - 작품 삭제 요청(S-19): 운영자가 해당 `app.project` 행을 지운다.
  ```
- **E-52 (T-08 백업 리전)** L646 `매일 \`pg_dump -n app\`을 떠서 비공개 S3에 두고` →
  `매일 \`pg_dump -n app\`을 떠서 비공개 S3(서울 리전 ap-northeast-2)에 두고`

**§10~§12**

- **E-53 (T-02)** L656 M2 끝나는 조건 칸의 `**앞 대형으로 돌아가 고치고 지울 수 있다.**` →
  `**앞 대형으로 돌아가 고치고 지울 수 있다. 대형 사이에 끼워 넣을 수 있다.**`
- **E-54 (T-11)** L659 M5 행 →
  `| M5 파일럿 | 1 + 운영 | 운영 배포, 온보딩(리더와 1:1로 첫 안무 입력: 조작은 리더가 하고 개발자는 설명만 한다. 멤버에게 파일 고르는 법 안내. 파일을 구하는 방법은 안내하지 않는다, §1.4), 피드백을 이슈로 올려 트리아지 | §1.3 완료 시나리오를 달성한다. 파일럿 관찰 기록을 남기고 이슈로 올린다(도움이 필요했던 지점, 개발자가 기기를 만진 순간, 잘못 고른 파일, E2·저장 불가·쓰기 실패 배너 발생과 스크린샷) |`
- **E-55 (T-11)** L672 SP-1 행: 확인할 것 칸 끝에 `. **같은 파일을 카톡 동영상(일반·HD)·카톡 파일 전송·m4a로 만들었을 때 duration 차이를 잰다.**`를 붙이고, 결과 칸 끝에 `, \`FILE_MATCH_TOLERANCE_MS\`(§7.4)`를 붙인다.
- **E-56 (T-11)** L674 SP-3 행 확인할 것 칸 `싱크 정확도: 3분 곡 전곡 기준 ±50ms를 기기별로 측정한다.` →
  `싱크 정확도: 3분 곡 전곡 기준 ±50ms(§8 정의)를 기기별로 측정한다.`
- **E-57 (T-08)** L675 SP-4 행: 확인할 것 칸에서 `, 닉네임이 들어 있는 \`user_metadata\` 키`를 지우고, 결과 칸의 `§6 규칙 3, `를 지운다.
- **E-58 (T-11)** L676 SP-5 행: 확인할 것 칸 끝에 `. 16×8에 댄서 20명, 6×4에 50명을 폰 세로로 추가하고 끌어낸다. 토큰 라벨 규칙("이름 앞 2글자"면 기본 이름은 모두 "댄서"로, 김서연과 김서윤은 둘 다 "김서"로 보인다). 저가 안드로이드에서 상한 문서의 A1 쓰기 1회 시간(100ms를 넘으면 이슈)`를 붙이고, 결과 칸 끝에 `, 토큰 라벨 규칙(§4.3), 댄서 겹침 비켜 놓기(트리아지 §2)`를 붙인다.
- **E-59 (T-08)** §12 `- **gh 토큰:** ...` 줄 [추가]
  `- **파일럿 동아리의 학교급(중·고·대):** 사용자가 확인한다. 중학교면 만 14세 미만 관련 항목을 다시 트리아지한다.`

- [ ] **Step 4: 남은 옛 문구가 없는지, 새 규칙이 들어갔는지 확인**

```bash
cd /c/project/KICKOFF && S=docs/superpowers/specs/2026-09-26-kickoff-v1-design.md
grep -nE 'ownerName|닉네임만|display_name|리더 ○○|대형 사이 끼워 넣기|약 0\.7MB|토큰 20개|user_metadata|x < 1/cols`' "$S"
for p in project-not-found FILE_MATCH_TOLERANCE_MS 1e-4 ap-northeast-2 '그리기 순서' '끼워 넣' '\*\*적용\*\*' '싱크 ±50ms의 정의' '학교급'; do printf '%s: ' "$p"; grep -c -- "$p" "$S"; done
grep -nF '\`' "$S"
```

Expected:
- 첫 grep은 **출력 없음.** 한 줄이라도 나오면 해당 E-항목을 다시 적용한다.
- 패턴별 줄 수가 최소값 이상이다: `project-not-found` 7, `FILE_MATCH_TOLERANCE_MS` 2, `1e-4` 1(그 한 줄에 두 번), `ap-northeast-2` 2, `그리기 순서` 1, `끼워 넣` 4, `**적용**` 2, `싱크 ±50ms의 정의` 1, `학교급` 1. (초안 3판 사본에 E-01~E-59를 모두 적용해 잰 값이다.)
- 마지막 grep(백슬래시-백틱)은 **출력 없음.**

- [ ] **Step 5: 트리아지 대응 자체 점검(5분)**

트리아지 §1의 T-01~T-11 각 불릿을 위에서부터 읽으며 E-번호를 PR 본문 표에 적는다. 대응이 없는 불릿이 있으면 스펙을 더 고친다. 트리아지 §2(비켜 놓기)는 **이 PR에 넣지 않는다**(SP-5 뒤 결과 PR, Task 15). §3은 이 계획서 Task 10에, §4는 M1 계획에 들어간다.

- [ ] **Step 6: 커밋·푸시·PR**

```bash
source ~/.kickoff-env && cd /c/project/KICKOFF
git add docs/superpowers/specs/2026-09-26-kickoff-v1-design.md
git commit -m "$S_SPEC docs(spec): 외부 검사 트리아지 반영

T-01~T-11을 스펙에 반영한다. 근거: docs/reviews/2026-09-26-external-review-triage.md

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
git push -u origin docs/1-review-triage
gh pr create --repo "$ORG/$REPO" --base develop --title "$S_SPEC docs(spec): 외부 검사 트리아지 반영" --body "Closes #1

## 무엇을
트리아지 T-01~T-11을 스펙에 반영 (E-01~E-59).

## 대응표
| 트리아지 | 스펙 편집 |
|---|---|
| T-01 | E-04, E-05, E-12, E-16, E-37, E-40 |
| T-02 | E-03, E-07, E-34, E-40, E-53 |
| T-03 | E-20, E-21, E-35, E-36, E-40, E-42 |
| T-04 | E-22, E-23 |
| T-05 | E-14, E-15, E-28, E-29, E-41 |
| T-06 | E-13, E-17, E-25, E-30~E-32, E-38, E-39, E-41, E-42 |
| T-07 | E-33, E-41 |
| T-08 | E-06, E-08, E-10~E-12, E-19, E-24, E-26, E-27, E-46, E-47, E-49~E-52, E-57, E-59 |
| T-09 | E-18 |
| T-10 | E-09, E-45, E-48 |
| T-11 | E-43, E-44, E-54~E-56, E-58 |
| 공개 레포 결정(T0 Step 3) | E-01 |
| T-01 파생: §4.1 화면 목록 정합성 | E-16 |
| 변경 이력 | E-02 |

## 확인 방법
- 계획서 Task 3 Step 4: 옛 문구 grep 0건, 패턴별 최소값 모두 충족, 백슬래시-백틱 0건

🤖 Generated with [Claude Code](https://claude.com/claude-code)"
```

- [ ] **Step 7: 리뷰와 머지**

PR 번호는 보통 2다(아래에서는 `2`로 쓴다. 다르면 바꾼다). 명령 앞에는 `source ~/.kickoff-env`를 한다.

1. `ci-ok`가 초록인지 본다: `gh pr checks 2 --repo "$ORG/$REPO"` → `ci-ok  pass`.
2. 리뷰: 이 PR은 스펙 변경이므로 Fable 5.1 high로 한 번 리뷰한다(스프린트당 1~2회 슬롯 중 1회). Claude Code에서 `/model`로 Fable을 고르고 `/code-review 2 --comment`를 실행한 뒤 모델을 되돌린다. (AI 리뷰 봇은 Task 5에서 붙으므로 이 PR에는 없다.)
3. 코멘트 스레드마다 **수정 커밋 또는 사유 답글을 단 뒤에만** resolve한다.
4. 머지 가능 상태 확인 (Review Focus 1): `gh pr view 2 --repo "$ORG/$REPO" --json mergeStateStatus --jq .mergeStateStatus` → `CLEAN`. `BLOCKED`면 남은 스레드나 `ci-ok`를 본다.
5. 머지: `gh pr merge 2 --repo "$ORG/$REPO" --squash --delete-branch`
6. 확인: `gh issue view 1 --repo "$ORG/$REPO" --json state --jq .state` → `CLOSED`. 칸반에서 #1이 Done으로 갔는지 본다.
7. **첫 squash 커밋의 작성자 확인 (Review Focus 3):** `cd /c/project/KICKOFF && git fetch origin && git log -1 --format='%an <%ae> | %cn <%ce>' origin/develop` → 작성자가 `…@users.noreply.github.com`, 커미터가 `GitHub <noreply@github.com>`. 개인 주소가 보이면 **다음 PR을 머지하기 전에** T0 Step 4의 1번(계정 이메일 비공개)을 확인한다. 이미 들어간 커밋은 룰셋 때문에 고칠 수 없다.
8. **검토에서 나온 스펙 모호점을 이슈로 남긴다**(트리아지 대상, 이 PR에서는 고치지 않는다):
   ```bash
   source ~/.kickoff-env
   gh issue create --repo "$ORG/$REPO" --title "[$S_SPEC] 스펙 모호점: A7 [서버 버전 불러오기]의 GET이 project-not-found 404를 받을 때" --body "초안 3판부터 A7은 GET 실패를 모두 '조회 실패 안내, 상태 유지'로 두고, §7.6은 에디터의 작품 404를 A9로 보낸다. 트리아지 T-06 뒤 두 규칙이 부딪친다. 지금 동작은 데이터를 잃지 않는 쪽(상태 유지)이다. 트리아지가 필요하다."
   ```
9. 로컬 정리: `git switch develop && git pull --ff-only`

---

### Task 4: 하네스 — CLAUDE.md, 서브에이전트 4종, 쓰기 범위 훅

> 👤 새 세션에서 실측 2회 · 🤖 구현 · 모델: Opus 5.5 high · 1일 · Jira: `S_SETUP`

**실무 관점:** 멘토 레포들의 "하네스"는 결국 문서 + git + CI + 영역 소유권이었다. 여기서는 그 규칙을 Claude가 매 세션 읽는 `CLAUDE.md`로 적고, "백엔드 에이전트는 `api/`만"을 말이 아닌 **훅으로 강제**한다. 사람 팀에서 CODEOWNERS와 브랜치 보호가 하는 일을 에이전트 팀에서는 훅이 한다. 훅은 문서 요약으로 알아낸 입력 형식(`agent_type`)에 기대므로, 코드를 쓰기 전에 실제 입력을 한 번 찍어 본다(Step 2). 추측으로 만든 경계는 조용히 뚫린다.

**Files:**
- Create: `CLAUDE.md`
- Create: `.claude/agents/backend.md`, `.claude/agents/frontend.md`, `.claude/agents/reviewer.md`, `.claude/agents/researcher.md`
- Create: `.claude/hooks/area-guard-lib.mjs`(판단 로직), `.claude/hooks/area-guard.mjs`(훅 진입점), `.claude/hooks/area-guard.test.mjs`
- Create: `.claude/settings.json`
- Modify: `.github/workflows/ci.yml` (`harness` 잡 추가, `ci-ok`가 그 결과를 본다)

**Interfaces:**
- Consumes: T1의 `ci.yml`(`ci-ok` 잡), 룰셋
- Produces: `decide(input) → string | null`(막을 이유 또는 null), 에이전트 이름 `backend`, `frontend`, `reviewer`, `researcher`. T7~T13에서 스파이크 페이지를 `frontend` 서브에이전트에 맡길 수 있다. M1이 `ci.yml`에 `changes`·`web`·`api` 잡을 더할 때 `ci-ok`의 `needs`에 넣는다.

- [ ] **Step 1: 이슈와 브랜치**

```bash
source ~/.kickoff-env && cd /c/project/KICKOFF && git switch develop && git pull --ff-only
N=$(gh issue create --repo "$ORG/$REPO" --title "[$S_SETUP] 하네스: CLAUDE.md, 서브에이전트, 쓰기 범위 훅" --body "스펙 §3.3 에이전트 격리. 계획 T4." | grep -o '[0-9]*$')
git switch -c "chore/$N-harness" && git branch --show-current
```

- [ ] **Step 2 (👤): 훅 입력을 실제로 찍어 본다**

문서 요약으로 알아낸 두 사실을 확인한다: ①서브에이전트 안에서만 `agent_type`이 들어온다 ②파일 쓰기 도구 이름이 `Write`다.

🤖가 임시 파일 두 개를 만든다(커밋하지 않는다. 사용자의 `settings.local.json`은 건드리지 않도록 별도 파일로 주입한다):

`.claude/hooks/log-payload.mjs`:

```js
import { appendFileSync } from 'node:fs'
let s = ''
for await (const c of process.stdin) s += c
appendFileSync(new URL('./payloads.jsonl', import.meta.url), s.trim() + '\n')
```

`.claude/probe-settings.json`:

```json
{
  "hooks": {
    "PreToolUse": [
      { "matcher": "Edit|Write|NotebookEdit", "hooks": [ { "type": "command", "command": "node", "args": ["${CLAUDE_PROJECT_DIR}/.claude/hooks/log-payload.mjs"] } ] }
    ]
  }
}
```

👤 **새 터미널**에서 `cd /c/project/KICKOFF && claude --settings .claude/probe-settings.json`을 열고(폴더 신뢰 창이 나오면 허용), 이렇게 입력한다:

```
general-purpose 서브에이전트를 불러서 probe-sub.txt 파일에 "sub"라고 쓰게 해 줘. 그다음 너도 probe-main.txt에 "main"이라고 써 줘.
```

세션을 닫고 🤖가 확인한다:

```bash
node -e 'for (const l of require("fs").readFileSync(".claude/hooks/payloads.jsonl","utf8").trim().split("\n")) { const j = JSON.parse(l); console.log(j.tool_name, j.agent_type ?? "(없음)", j.tool_input.file_path) }'
```

Expected: 두 줄. `Write general-purpose …probe-sub.txt`와 `Write (없음) …probe-main.txt`.
- 두 줄 모두 `(없음)`이면 `agent_type` 가정이 틀렸다. 멈추고 `payloads.jsonl`의 전체 필드를 보고 사용자와 대안(에이전트 frontmatter `hooks:`로 에이전트별 훅 달기)을 정한다.
- 줄이 없으면 exec 형식이 동작하지 않은 것이다. `probe-settings.json`의 훅을 셸 형식 `"command": "node \"$CLAUDE_PROJECT_DIR/.claude/hooks/log-payload.mjs\""`(Git Bash로 실행됨)로 바꿔 다시 한다. 이때 Step 8의 `settings.json`도 같은 형식으로 쓴다.

정리:

```bash
cd /c/project/KICKOFF && rm -f probe-sub.txt probe-main.txt .claude/hooks/payloads.jsonl .claude/hooks/log-payload.mjs .claude/probe-settings.json
```

- [ ] **Step 3: 실패하는 테스트를 쓴다**

`.claude/hooks/area-guard.test.mjs`:

```js
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
```

- [ ] **Step 4: 실패를 확인한다**

Run: `node --test .claude/hooks/area-guard.test.mjs`
Expected: FAIL — `Cannot find module …area-guard-lib.mjs`

- [ ] **Step 5: 구현한다**

`.claude/hooks/area-guard-lib.mjs`:

```js
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
```

`.claude/hooks/area-guard.mjs`:

```js
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
```

종료 코드 2는 JSON 판단보다 항상 우선해 도구를 막는다. 그래서 이 훅은 판단을 JSON으로만 내고 늘 0으로 끝낸다.

- [ ] **Step 6: 통과를 확인한다**

Run: `node --test .claude/hooks/area-guard.test.mjs`
Expected: `pass 13`, `fail 0`

- [ ] **Step 7: 서브에이전트 4종**

`.claude/agents/backend.md`:

```markdown
---
name: backend
description: api/ 아래 Spring Boot 코드와 테스트를 구현한다. 엔드포인트, 영속성, 보안 설정, 통합 테스트 태스크에 쓴다. contract/openapi.yaml은 고치지 않는다.
tools: Read, Grep, Glob, Bash, Edit, Write
model: opus
effort: high
color: green
---

너는 KICKOFF의 백엔드 구현 담당이다.
- `api/` 아래만 고친다. 다른 곳을 고쳐야 하면 멈추고 무엇이 왜 필요한지 보고한다.
- `contract/openapi.yaml`이 바뀌어야 하면 직접 고치지 말고 오케스트레이터에게 보고한다.
- 스펙 규칙 번호(예: §6 규칙 5, §7.2.3 A4)를 테스트 이름에 남겨 추적할 수 있게 한다.
- 끝내기 전에 테스트를 돌리고, 돌린 명령과 결과를 보고에 붙인다.
```

`.claude/agents/frontend.md`:

```markdown
---
name: frontend
description: web/ 아래 React + Vite(TypeScript) 코드와 테스트를 구현한다. 화면, 편집 엔진, 자동 저장 장치, 스파이크 페이지 태스크에 쓴다. contract/openapi.yaml은 고치지 않는다.
tools: Read, Grep, Glob, Bash, Edit, Write
model: opus
effort: high
color: blue
---

너는 KICKOFF의 프론트엔드 구현 담당이다.
- `web/` 아래만 고친다. 다른 곳을 고쳐야 하면 멈추고 무엇이 왜 필요한지 보고한다.
- `contract/openapi.yaml`이 바뀌어야 하면 직접 고치지 말고 오케스트레이터에게 보고한다.
- UI 문구는 한국어로 쓴다. 페이지 확대를 막지 않는다. 드래그 대상에는 `touch-action: none`을 준다(스펙 §4.3).
- 스펙 규칙 번호를 테스트 이름에 남긴다. 끝내기 전에 테스트와 빌드를 돌리고 결과를 보고에 붙인다.
```

`.claude/agents/reviewer.md`:

```markdown
---
name: reviewer
description: 읽기 전용 리뷰어. 태스크를 마친 변경(diff)을 스펙과 CLAUDE.md 기준으로 검토한다. 파일을 고치지 않는다.
tools: Read, Grep, Glob, Bash
disallowedTools: Edit, Write, NotebookEdit
model: opus
effort: high
color: purple
---

너는 KICKOFF의 리뷰어다. 파일을 고치지 않고 발견만 보고한다.
- 기준: 스펙(`docs/superpowers/specs/`)의 해당 규칙, `CLAUDE.md`, 태스크의 완료 조건.
- 발견마다: 파일:줄, 무엇이 틀렸는지, 어떤 입력에서 깨지는지, 근거 규칙 번호.
- 스타일 취향은 적지 않는다. 버그, 스펙 위반, 데이터 손실, 보안, 빠진 테스트만 적는다.
```

`.claude/agents/researcher.md`:

```markdown
---
name: researcher
description: 읽기 전용 조사원. 공식 문서와 소스로 사실을 확인하고 출처와 함께 보고한다. 파일을 고치지 않는다.
tools: Read, Grep, Glob, WebFetch, WebSearch
model: sonnet
effort: medium
color: yellow
---

너는 KICKOFF의 조사원이다.
- 공식 문서, 공식 소스 코드, 변경 기록을 먼저 본다. 블로그와 포럼은 보조로만 쓰고 그렇다고 표시한다.
- 사실마다 출처 URL과 확인 수준(공식 확인 / 보조 자료 / 추론)을 붙인다.
- 확인하지 못한 것은 확인하지 못했다고 쓴다.
```

- [ ] **Step 8: 훅 연결**

`.claude/settings.json` (Step 2에서 셸 형식으로 바꿨다면 그 형식을 쓴다):

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Edit|Write|NotebookEdit",
        "hooks": [
          { "type": "command", "command": "node", "args": ["${CLAUDE_PROJECT_DIR}/.claude/hooks/area-guard.mjs"] }
        ]
      }
    ]
  }
}
```

- [ ] **Step 9: CLAUDE.md**

`CLAUDE.md`:

```markdown
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
```

- [ ] **Step 10: CI에 하네스 테스트를 넣는다**

`.github/workflows/ci.yml`의 `jobs:`를 다음으로 바꾼다(`on:`의 `types`와 `ci-ok`의 두 가드 단계는 T1 그대로 두고 `needs`와 결과 확인을 더한다):

```yaml
jobs:
  harness:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v6
      - run: node --version && node --test .claude/hooks/area-guard.test.mjs

  # 필수 체크는 이 잡 하나다(스펙 §8). 영역별 잡이 생기면 needs에 넣는다(M1).
  ci-ok:
    if: always()
    needs: [harness]
    runs-on: ubuntu-latest
    steps:
      - name: spike 브랜치는 머지하지 않는다 (스펙 §11)
        if: startsWith(github.head_ref, 'spike/')
        run: |
          echo "::error::spike/* 브랜치는 develop에 머지하지 않는다 (스펙 §11)"
          exit 1
      - name: 릴리스 PR의 head는 이 레포의 develop만 (스펙 §3.3)
        if: github.base_ref == 'main' && (github.head_ref != 'develop' || github.event.pull_request.head.repo.full_name != github.repository)
        run: |
          echo "::error::main으로 가는 PR의 head는 develop이어야 한다 (스펙 §3.3)"
          exit 1
      - name: 앞선 잡 결과 확인 (skipped는 통과)
        if: contains(needs.*.result, 'failure') || contains(needs.*.result, 'cancelled')
        run: |
          echo "::error::실패하거나 취소된 잡이 있다: ${{ join(needs.*.result, ', ') }}"
          exit 1
      - run: echo "ci-ok"
```

M0에서는 `harness` 잡이 1초 남짓이라 경로 조건 없이 늘 돈다. 경로 조건(`dorny/paths-filter@v4`)은 `web`·`api` 잡이 생기는 M1에서 붙인다.

- [ ] **Step 11 (👤): 실제 세션에서 훅이 막는지 본다**

커밋 전에, 👤 새 터미널에서 `claude`를 열고 입력한다:

```
backend 서브에이전트에게 web/probe.txt 파일을 만들라고 시켜 줘. 그다음 backend 서브에이전트에게 api/probe.txt 파일을 만들라고 시켜 줘. 결과를 그대로 알려 줘.
```

Expected: 첫 번째는 "backend는 api/ 아래만 쓴다. 막힌 경로: web/probe.txt"로 거부되고, 두 번째는 만들어진다. 세션을 닫고 `rm -f api/probe.txt web/probe.txt && rmdir api web 2>/dev/null; git status --short`로 정리한다.

- [ ] **Step 12: 커밋·PR·머지**

```bash
source ~/.kickoff-env && cd /c/project/KICKOFF
B=$(git branch --show-current); N=$(echo "$B" | sed -E 's#^[a-z]+/([0-9]+)-.*#\1#'); echo "$B #$N"
git add CLAUDE.md .claude/agents .claude/hooks .claude/settings.json .github/workflows/ci.yml
git status --short   # probe-settings.json, payloads.jsonl, probe 파일이 없어야 한다
git commit -m "$S_SETUP chore(harness): CLAUDE.md, 서브에이전트 4종, 쓰기 범위 훅

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
git push -u origin HEAD
gh pr create --repo "$ORG/$REPO" --base develop --title "$S_SETUP chore(harness): CLAUDE.md, 서브에이전트 4종, 쓰기 범위 훅" --body "Closes #$N

## 무엇을 / 왜
스펙 §3.3 에이전트 격리를 CLAUDE.md와 PreToolUse 훅으로 구현한다.

## 확인 방법
- node --test .claude/hooks/area-guard.test.mjs (13 pass), CI harness 잡
- 실제 세션: backend가 web/ 쓰기 거부, api/ 쓰기 허용 (계획 T4 Step 11)

🤖 Generated with [Claude Code](https://claude.com/claude-code)"
gh pr checks "$B" --repo "$ORG/$REPO" --watch
```

Expected: `harness pass`, `ci-ok pass`. 머지(새 셸에서도 되도록 머리부터 다시 쓴다):

```bash
source ~/.kickoff-env && cd /c/project/KICKOFF && B=$(git branch --show-current)
gh pr merge "$B" --repo "$ORG/$REPO" --squash --delete-branch && git switch develop && git pull --ff-only
```

---

### Task 5: AI 리뷰 봇 (claude-code-action)

> 👤 GitHub App 설치·토큰 · 🤖 워크플로 · 모델: Opus 5.5 high · 0.5일 · Jira: `S_SETUP`

**실무 관점:** 실무의 AI 리뷰는 "봇이 모든 PR에 1차 코멘트, 사람이 판단"이다. 봇은 머지를 막지 않는다(필수 체크 아님). 대신 룰셋의 "대화 해결 필수"가 봇 코멘트를 그냥 지나치지 못하게 한다. 1인 레포에서는 작성자가 스스로 resolve할 수 있으니, 이 게이트는 강제가 아니라 규율이다. 그래서 "수정 커밋이나 사유 답글 뒤에만 resolve"를 규칙으로 적어 둔다.

**Files:**
- Create: `.github/workflows/claude-review.yml`

**Interfaces:**
- Consumes: 저장소 시크릿 `CLAUDE_CODE_OAUTH_TOKEN`, Claude GitHub App
- Produces: `develop`으로 가는 모든 비초안 PR에 한국어 리뷰 코멘트(체크 이름 `review`, 필수 아님)

- [ ] **Step 1: 이슈와 브랜치**

```bash
source ~/.kickoff-env && cd /c/project/KICKOFF && git switch develop && git pull --ff-only
N=$(gh issue create --repo "$ORG/$REPO" --title "[$S_SETUP] AI 리뷰 봇 (claude-code-action)" --body "스펙 §3.3 AI 리뷰. 계획 T5." | grep -o '[0-9]*$')
git switch -c "ci/$N-claude-review"
```

- [ ] **Step 2 (👤): Claude GitHub App을 조직에 설치한다**

https://github.com/apps/claude → Install → `$ORG` → **Only select repositories** → `$REPO`.

- [ ] **Step 3 (👤): 구독 토큰을 저장소 시크릿에 넣는다**

**Claude Code 밖의 별도 Git Bash 창에서** 실행한다(Claude Code 안에서 `!`로 실행하면 토큰이 세션 기록과 대화에 남는다). 토큰을 Claude 대화에 붙여 넣지 않는다.

```bash
source ~/.kickoff-env
claude setup-token
gh secret set CLAUDE_CODE_OAUTH_TOKEN --repo "$ORG/$REPO"
gh secret list --repo "$ORG/$REPO"
```

`claude setup-token`이 브라우저 로그인 뒤 출력한 토큰을, `gh secret set`의 입력 프롬프트에 붙여 넣는다(셸 기록에 남지 않게 명령줄 인자로 주지 않는다). Expected: 목록에 `CLAUDE_CODE_OAUTH_TOKEN` 하나. 이 토큰은 사용자 구독에 묶이며 리뷰 사용량은 구독 한도에서 나간다.

- [ ] **Step 4: 워크플로를 쓴다**

`.github/workflows/claude-review.yml`:

```yaml
name: claude-review

on:
  pull_request:
    branches: [develop]
    types: [opened, synchronize, ready_for_review, reopened]

permissions:
  contents: read

concurrency:
  group: claude-review-${{ github.event.pull_request.number }}
  cancel-in-progress: true

jobs:
  # 필수 체크가 아니다(스펙 §3.3). 초안 PR은 건너뛴다.
  review:
    if: github.event.pull_request.draft == false
    runs-on: ubuntu-latest
    timeout-minutes: 15
    permissions:
      contents: read
      pull-requests: read
      issues: read
      id-token: write
    steps:
      - uses: actions/checkout@v6
        with:
          fetch-depth: 1
      - uses: anthropics/claude-code-action@v1
        with:
          claude_code_oauth_token: ${{ secrets.CLAUDE_CODE_OAUTH_TOKEN }}
          plugin_marketplaces: "https://github.com/anthropics/claude-code.git"
          plugins: "code-review@claude-code-plugins"
          prompt: |
            /code-review:code-review --comment ${{ github.repository }}/pull/${{ github.event.pull_request.number }}

            리뷰 코멘트(요약과 인라인 모두)는 한국어로 쓴다. 기준은 스펙(docs/superpowers/specs/)과 CLAUDE.md 규칙이다.
          claude_args: |
            --allowedTools "mcp__github_inline_comment__create_inline_comment"
            --model claude-opus-5-5
            --max-turns 30
```

알아 둘 동작:
- 리뷰 스킬은 **Claude가 이미 코멘트를 단 PR은 건너뛴다.** 수정 뒤 재리뷰는 로컬에서 `/code-review <PR번호> --comment`로 한다(스펙 §3.3과 같다).
- 액션은 PR의 `.claude/`와 `CLAUDE.md`를 base 브랜치 것으로 되돌린 뒤 돈다. PR이 리뷰 규칙을 바꿔치기할 수 없다.
- 포크 PR에는 시크릿이 없어 돌지 않는다(1인 레포라 상관없다).

- [ ] **Step 5: 커밋·PR — 이 PR에서는 봇이 코멘트 없이 넘어간다(정상)**

```bash
source ~/.kickoff-env && cd /c/project/KICKOFF
B=$(git branch --show-current); N=$(echo "$B" | sed -E 's#^[a-z]+/([0-9]+)-.*#\1#'); echo "$B #$N"
git add .github/workflows/claude-review.yml
git commit -m "$S_SETUP ci(review): claude-code-action 리뷰 봇

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
git push -u origin HEAD
gh pr create --repo "$ORG/$REPO" --base develop --title "$S_SETUP ci(review): claude-code-action 리뷰 봇" --body "Closes #$N

## 무엇을 / 왜
develop으로 가는 PR에 한국어 1차 리뷰를 단다. 필수 체크가 아니다(스펙 §3.3).

## 확인 방법
- 이 PR에서 review 잡은 pass지만 'workflow validation' 경고와 함께 코멘트 없이 끝난다(워크플로를 추가하는 PR이라 기본 브랜치 파일과 달라서. 정상)
- 실제 한국어 리뷰는 다음 PR(T6)에서 확인한다
- 룰셋 필수 체크는 ci-ok 하나뿐이다

🤖 Generated with [Claude Code](https://claude.com/claude-code)"
gh pr checks "$B" --repo "$ORG/$REPO" --watch
```

Expected: `ci-ok pass`, `review pass`. review 로그에 `Action skipped due to workflow validation` 경고가 있고 **코멘트는 달리지 않는다.** 워크플로를 추가·수정하는 PR에서는 항상 이렇다(액션이 기본 브랜치의 워크플로와 같은지 확인한다). `review`가 **실패**하면 Actions 로그에서 인증(토큰·앱 설치) 오류부터 본다.

- [ ] **Step 6: 필수 체크가 아닌지 확인하고 머지**

```bash
source ~/.kickoff-env && cd /c/project/KICKOFF
gh api "repos/$ORG/$REPO/rules/branches/develop" --jq '[.[] | select(.type=="required_status_checks") | .parameters.required_status_checks[].context]'
```

Expected: `["ci-ok"]`. 그다음 머지:

```bash
source ~/.kickoff-env && cd /c/project/KICKOFF && B=$(git branch --show-current)
gh pr merge "$B" --repo "$ORG/$REPO" --squash --delete-branch && git switch develop && git pull --ff-only
```

---

### Task 6: 외부 서비스 셋업 — Cloudflare Pages, Supabase 스테이징, 카카오 앱

> 👤 콘솔 작업 · 🤖 확인 명령과 기록 문서 · 모델: Opus 5.5 high · 1일 · Jira: `S_SETUP`

**실무 관점:** 외부 서비스 설정은 코드가 아니라서 잊히기 쉽고, 몇 달 뒤 "이 값을 어디서 켰더라?"가 가장 흔한 운영 사고다. 그래서 무엇을 어디에 켰는지를 문서로 PR에 남긴다(비밀값 자체는 적지 않고 "어디에 있는지"만 적는다). M0에는 스파이크에 필요한 것만 켠다. 운영(prod) 프로젝트와 도메인은 M1 일이다.

**Files:**
- Create: `docs/ops/external-services.md`

**Interfaces:**
- Consumes: T1 레포, T0의 `PAGES`
- Produces: `~/.kickoff-env`의 `SUPA_REF`, `SUPA_PUBLISHABLE`, Pages 미리보기 환경변수 `VITE_SUPABASE_URL`·`VITE_SUPABASE_PUBLISHABLE_KEY`(T11), 브랜치 별칭 규칙(T7)

- [ ] **Step 1: 이슈와 브랜치**

```bash
source ~/.kickoff-env && cd /c/project/KICKOFF && git switch develop && git pull --ff-only
N=$(gh issue create --repo "$ORG/$REPO" --title "[$S_SETUP] 외부 서비스 셋업: Pages, Supabase 스테이징, 카카오 앱" --body "스펙 §10 M0 외부 셋업. 계획 T6." | grep -o '[0-9]*$')
git switch -c "docs/$N-external-services"
```

- [ ] **Step 2 (👤): Cloudflare Pages 프로젝트**

1. Cloudflare 가입(무료) → Workers & Pages → Create → **Pages** → Connect to Git → GitHub에서 Cloudflare Pages 앱을 `$ORG`에 설치(Only select repositories → `$REPO`).
2. 저장소 `$REPO` 선택 → 프로젝트 이름 `$PAGES`, Production branch `main`, Framework preset **Vite**(React), Build command `npm run build`, Build output `dist`, Root directory `web`.
3. 첫 빌드는 `main`에 `web/`이 없어 **실패한다. 정상이다.**
4. Settings → Builds:
   - Branch control: Production branch `main`, **Enable automatic production branch deployments = 끔**(M1에서 켠다). Preview branch: **Custom branches**, Include `spike/*`.
   - Build watch paths: Include `web/*`.

- [ ] **Step 3 (👤): Supabase 스테이징 프로젝트**

1. supabase.com → New project → 이름 `$REPO-staging`, Region **Northeast Asia (Seoul)**, DB 비밀번호는 비밀번호 관리자에 저장.
2. Project Settings → API Keys에서 **Publishable key**(`sb_publishable_…`)를 복사한다. 이 키는 브라우저에 넣는 공개용이다. `sb_secret_…`은 쓰지 않는다.
3. Authentication → URL Configuration: Site URL `https://spike-m0-lab.$PAGES.pages.dev`, Redirect URLs `https://*.$PAGES.pages.dev/**`와 `http://localhost:5173/**`. (`*`는 `.`을 넘지 못하므로 `<hash>.$PAGES.pages.dev`와 `spike-m0-lab.$PAGES.pages.dev`만 맞는다.)

```bash
cat >> ~/.kickoff-env <<'EOF'
export SUPA_REF=바꾸기-프로젝트ref SUPA_PUBLISHABLE=바꾸기-sb_publishable_키
EOF
notepad ~/.kickoff-env
```

메모장에서 값을 고치고 **저장하고 닫은 뒤** `source ~/.kickoff-env && ! grep -q 바꾸기 ~/.kickoff-env && echo OK` → `OK`.

- [ ] **Step 4 (👤): 카카오 디벨로퍼스 앱**

developers.kakao.com → 내 애플리케이션 → 애플리케이션 추가(앱 이름 `$NAME staging`). 그다음(메뉴 이름은 콘솔 개편으로 조금 다를 수 있다):
1. **앱 설정 > 앱 > 플랫폼 키 > REST API 키**를 눌러 편집 화면을 연다. 키 값을 복사하고, 같은 화면의 **카카오 로그인 Redirect URI**에 `https://$SUPA_REF.supabase.co/auth/v1/callback` 하나만 넣는다(와일드카드는 여기가 아니라 Supabase 쪽에 있다).
2. **제품 설정 > 카카오 로그인** → 활성화 **ON**.
3. 동의항목(제품 설정 > 카카오 로그인 > 동의항목): 닉네임(`profile_nickname`) **필수 동의**, 프로필 사진(`profile_image`) **선택 동의**, 카카오계정(이메일)은 비즈 앱이 아니면 켤 수 없으니 그대로 둔다. **비즈 앱 전환은 아직 하지 않는다**(SP-4가 전환 없이 되는지부터 잰다).
4. 1번의 REST API 키 편집 화면에서 **카카오 로그인 Client Secret 코드**를 복사한다(활성화 토글이 있으면 켠다).

- [ ] **Step 5 (👤): Supabase에 카카오 공급자를 연결한다**

Authentication → Sign In / Providers → Kakao → Enable, Client ID = REST API 키, Client Secret = 카카오 Client Secret, **Allow users without an email = ON** → Save.

- [ ] **Step 6 (👤): Pages 미리보기 환경변수**

Pages 프로젝트 → Settings → Variables and Secrets → **Preview** 환경에 `VITE_SUPABASE_URL=https://$SUPA_REF.supabase.co`, `VITE_SUPABASE_PUBLISHABLE_KEY=$SUPA_PUBLISHABLE`을 넣는다(평문 변수. 공개용 키다). Production에는 넣지 않는다.

- [ ] **Step 7: 설정을 명령으로 확인한다**

```bash
source ~/.kickoff-env
curl -s "https://$SUPA_REF.supabase.co/auth/v1/settings" -H "apikey: $SUPA_PUBLISHABLE" | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{const j=JSON.parse(s);console.log("kakao:",j.external?.kakao)})'
curl -s "https://$SUPA_REF.supabase.co/auth/v1/.well-known/jwks.json" | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{for(const k of JSON.parse(s).keys)console.log(k.kid,k.alg,k.kty,k.crv??"")})'
```

Expected: `kakao: true`, 그리고 서명 키 한 줄 이상(예: `… ES256 EC P-256`). 이 alg는 SP-4 결과표에 미리 적어 둔다.

- [ ] **Step 8: 기록 문서를 만든다**

```bash
source ~/.kickoff-env && cd /c/project/KICKOFF
: "${NAME:?}${ORG:?}${REPO:?}${KEY:?}${JIRA_SITE:?}${PAGES:?}${SUPA_REF:?}"   # 빈 변수가 있으면 여기서 멈춘다
mkdir -p docs/ops && cat > docs/ops/external-services.md <<EOF
# 외부 서비스 설정 기록

비밀값(비밀번호, Client Secret, 토큰)은 여기에 적지 않는다. **어디에 있는지만** 적는다. 설정을 바꾸면 이 표도 같은 PR에서 고친다.

| 서비스 | 이름·식별자 | 지역 | 켠 설정 | 비밀값 위치 | M1에서 바꿀 것 |
|---|---|---|---|---|---|
| GitHub | \`$ORG/$REPO\`(공개) | — | 룰셋 develop·main(\`docs/ops/github/\`), push protection, 자동 링크 \`$KEY-\`, 라벨 3개 | 저장소 시크릿 \`CLAUDE_CODE_OAUTH_TOKEN\` | Environment \`deploy\`(SSH 키, E2E 계정) |
| Jira | \`$JIRA_SITE.atlassian.net\`, 키 \`$KEY\` | — | Scrum(team-managed), GitHub for Atlassian, 자동화 "릴리스 PR 머지 → 스토리 완료" | — | M1 에픽 |
| Cloudflare Pages | \`$PAGES\` | — | Git 연결, root \`web\`, Vite, 빌드 감시 \`web/*\`, 미리보기 \`spike/*\`만, 운영 자동 배포 끔 | Preview 변수 \`VITE_SUPABASE_URL\`, \`VITE_SUPABASE_PUBLISHABLE_KEY\`(공개용) | 미리보기 전체 브랜치, 운영 자동 배포 켜기, 도메인, \`_headers\` |
| Supabase(스테이징) | \`$SUPA_REF\` | 서울 | Auth Kakao, Allow users without an email ON, 리다이렉트 \`https://*.$PAGES.pages.dev/**\`·\`http://localhost:5173/**\` | DB 비밀번호: 사용자 비밀번호 관리자 | 운영 프로젝트, E2E용 이메일 로그인, 스키마 \`app\`·역할 |
| Kakao Developers | 앱 "$NAME staging" | — | 카카오 로그인 ON, Redirect URI \`https://$SUPA_REF.supabase.co/auth/v1/callback\`, 닉네임 필수·사진 선택 | Client Secret: Supabase 대시보드에만 | 비즈 앱 전환 여부(SP-4 결과) |
EOF
grep -c 바꾸기 docs/ops/external-services.md
```

Expected: `0`.

- [ ] **Step 9: 커밋·PR·머지**

```bash
source ~/.kickoff-env && cd /c/project/KICKOFF
B=$(git branch --show-current); N=$(echo "$B" | sed -E 's#^[a-z]+/([0-9]+)-.*#\1#'); echo "$B #$N"
git add docs/ops/external-services.md
git commit -m "$S_SETUP docs(ops): 외부 서비스 설정 기록

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
git push -u origin HEAD
gh pr create --repo "$ORG/$REPO" --base develop --title "$S_SETUP docs(ops): 외부 서비스 설정 기록" --body "Closes #$N

## 무엇을 / 왜
M0 스파이크에 필요한 외부 서비스를 켜고, 무엇을 어디에 켰는지 남긴다(비밀값 없음).

## 확인 방법
- Supabase settings에서 kakao: true, JWKS 키 확인 (계획 T6 Step 7)

🤖 Generated with [Claude Code](https://claude.com/claude-code)"
gh pr checks "$B" --repo "$ORG/$REPO" --watch
```

Expected: `ci-ok pass`, `review pass`, 그리고 **이 PR에 봇의 한국어 리뷰(인라인 코멘트 또는 문제 없음 요약)가 달린다.** T5 봇의 첫 실제 동작 확인이다. 달리지 않으면 review 로그를 본다. 봇 스레드를 규칙대로 처리한 뒤 머지:

```bash
source ~/.kickoff-env && cd /c/project/KICKOFF && B=$(git branch --show-current)
gh pr merge "$B" --repo "$ORG/$REPO" --squash --delete-branch && git switch develop && git pull --ff-only
```

 스프린트 1이 끝났으면 **T16 릴리스 절차**를 한 번 돈다.

---

## 스프린트 2 — 스파이크

**스파이크 공통 규칙 (T7~T13)**
- 코드는 `spike/m0-lab` 브랜치 하나에 모은다. 빌린 기기로 한 번에 도는 기기 세션(T14)에서 **주소 하나**로 모든 스파이크를 열기 위해서다. 스파이크마다 이슈는 따로 만들되(라벨 `spike`), 브랜치·PR은 만들지 않는다. 이슈는 결과 PR(T15)이 닫는다.
- 주소: `https://spike-m0-lab.$PAGES.pages.dev/?sp=<번호>`. 문제가 생기면 주소 끝에 `&debug`를 붙여 eruda(모바일 콘솔)를 연다.
- 코드는 `frontend` 서브에이전트에 맡겨도 된다(하네스 첫 실사용). 이 계획의 코드는 Vite 8 + React 19 + TS 6 + Vitest 5로 **빌드와 테스트를 통과한 것**이다.
- 이 코드는 버린다. 제품 코드 품질 기준(오류 처리, 접근성, 상태 설계)을 적용하지 않는다. 대신 측정이 틀리지 않도록, 측정 로직(시계, 무대 규칙, 분석기)에만 테스트를 둔다.

### Task 7: 스파이크 랩 뼈대 (`spike/m0-lab`)

> 🤖(또는 `frontend` 서브에이전트) · 👤 휴대폰 확인 · 모델: Opus 5.5 high · 0.5일 · Jira: `S_LAB`

**실무 관점:** 스파이크는 "질문 하나에 답하는 버리는 코드"다. 답이 나오면 코드는 버리고 답(결과표)만 남긴다. 그래서 develop과 섞이지 않게 브랜치 이름(`spike/*`)과 CI 가드로 물리적으로 떼어 둔다(Review Focus 2). 또 기기 세션은 빌린 폰으로 짧게 하므로, 결과를 **폰에서 꺼내는 통로**(로그 복사·공유)를 맨 먼저 만든다.

**Files (브랜치 `spike/m0-lab`):**
- Create: `web/`(create-vite 템플릿), `web/.nvmrc`, `web/public/_headers`
- Create: `web/src/log.tsx`, `web/src/env-check.tsx`
- Replace: `web/src/main.tsx`
- Delete: `web/src/App.tsx`, `web/src/App.css`, `web/src/index.css`, `web/src/assets/`

**Interfaces:**
- Produces: `log(msg: string): void`, `<LogPanel />`, `pages: Record<string, [string, ComponentType]>`(T8~T13이 한 줄씩 더한다), 미리보기 별칭 주소

- [ ] **Step 1: 이슈와 브랜치**

```bash
source ~/.kickoff-env && cd /c/project/KICKOFF && git switch develop && git pull --ff-only
gh issue create --repo "$ORG/$REPO" --label spike --title "[$S_LAB] 스파이크 랩 뼈대 (spike/m0-lab)" --body "스펙 §11. 버리는 코드, develop에 머지하지 않는다. 결과 PR(T15)이 닫는다."
git switch -c spike/m0-lab
```

- [ ] **Step 2: Vite 템플릿**

```bash
cd /c/project/KICKOFF && npm create vite@latest web -- --template react-ts --no-interactive
cd web && npm install && npm install @supabase/supabase-js eruda && npm install -D vitest
npm pkg set scripts.test="vitest run"
echo 22 > .nvmrc
rm -rf src/App.tsx src/App.css src/index.css src/assets
sed -i 's/<html lang="en">/<html lang="ko">/; s#<title>web</title>#<title>KICKOFF 스파이크 랩</title>#' index.html
grep -E 'lang=|<title>|viewport' index.html
```

Expected: `lang="ko"`, 새 제목, `width=device-width, initial-scale=1.0`(확대를 막지 않는다). `.nvmrc`의 22는 Pages 빌드 이미지 기본값(Node 22)과 맞춘 것이다.

- [ ] **Step 3: 로그 패널**

`web/src/log.tsx`:

```tsx
// 기기 세션에서 결과를 꺼내는 통로. 카톡 인앱에서 클립보드가 막혀도 공유나 전체 선택으로 꺼낼 수 있게 한다.
import { useSyncExternalStore } from 'react'

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
    <section style={{ marginTop: 24 }}>
      <h2>로그</h2>
      <button onClick={copy}>로그 복사</button>{' '}
      {typeof navigator.share === 'function' && <button onClick={share}>로그 공유</button>}
      <textarea readOnly value={text} rows={14} style={{ width: '100%', fontSize: 12 }} />
    </section>
  )
}
```

- [ ] **Step 4: 환경 점검**

`web/src/env-check.tsx`:

```tsx
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
```

- [ ] **Step 5: 진입점**

`web/src/main.tsx`:

```tsx
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
```

- [ ] **Step 6: 미리보기 헤더**

`web/public/_headers` (스펙 §9.3 보안 헤더 + 스파이크는 통째로 검색 비노출):

```text
/*
  X-Robots-Tag: noindex
  Referrer-Policy: strict-origin-when-cross-origin
  X-Content-Type-Options: nosniff
  X-Frame-Options: DENY
```

- [ ] **Step 7: 빌드·푸시·미리보기 확인**

```bash
source ~/.kickoff-env && cd /c/project/KICKOFF/web && npm run build && cd .. && git add web && git commit -m "$S_LAB chore(spike): 스파이크 랩 뼈대

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>" && git push -u origin spike/m0-lab
```

Pages 빌드가 끝나면(대시보드 Deployments에서 확인, 1~2분):

```bash
source ~/.kickoff-env
curl -sI "https://spike-m0-lab.$PAGES.pages.dev/" | grep -iE '^(x-robots-tag|referrer-policy|x-frame-options|x-content-type-options):'
```

Expected: 네 줄. **`_headers`가 미리보기 배포에도 적용된다는 확인**이다(문서에 없던 사실, 결과표 "환경 점검"에 적는다). 네 줄이 없으면 그 사실을 적고 계속한다.

- [ ] **Step 8 (👤): 카톡 인앱에서 로그를 꺼낼 수 있는지 (Review Focus 4)**

카톡 "나와의 채팅"에 `https://spike-m0-lab.$PAGES.pages.dev/`를 보내고 눌러 연다. 목록과 환경 점검 표가 보이면 [로그 복사]를 누르고 나와의 채팅에 붙여 넣는다.
Expected: 붙여 넣은 글에 `UA: … KAKAOTALK …`와 `환경 점검: …`이 있다. 복사가 실패하면 [로그 공유] → 나와의 채팅, 그것도 안 되면 로그 칸을 길게 눌러 전체 선택 → 복사. **셋 다 안 되면 기기 세션 전에 이 문제부터 푼다**(예: 결과를 화면 사진으로 받기로 정한다).

- [ ] **Step 9: 스파이크 가드가 머지를 막는지 (Review Focus 2)**

```bash
source ~/.kickoff-env && cd /c/project/KICKOFF
gh pr create --repo "$ORG/$REPO" --draft --base develop --head spike/m0-lab --title "DO NOT MERGE: spike 가드 확인" --body "계획 T7 Step 9. 확인 뒤 닫는다."
gh pr checks --repo "$ORG/$REPO" spike/m0-lab --watch
```

Expected: `ci-ok fail`(로그에 `spike/* 브랜치는 develop에 머지하지 않는다`). 초안이라 AI 리뷰는 돌지 않는다. 확인했으면 `gh pr close --repo "$ORG/$REPO" spike/m0-lab`.

---

### Task 8: SP-1 파일·재생·화면 유지

> 🤖 · 👤 ffmpeg 설치, 내 폰 확인 · 모델: Opus 5.5 high · 0.5일 · Jira: `S_SP1`

**실무 관점:** 스펙의 재생 설계(§7.4)는 "브라우저가 이렇게 동작할 것"이라는 가정 위에 있다. 카톡 인앱은 문서가 없어 가정이 가장 약하다. 그래서 설계를 코드로 굳히기 전에 **가장 싼 코드로 가정을 깨 본다.** 테스트 파일은 직접 만든 클릭 트랙이다. 상업 음원을 카톡으로 주고받는 것 자체가 스펙 §1.4가 피하려는 일이기 때문이다.

**Files (브랜치 `spike/m0-lab`):**
- Create: `spike-tools/gen-assets.sh`, `web/src/sp1.tsx`
- Modify: `web/src/main.tsx` (import 1줄, `pages` 1줄)

**Interfaces:**
- Consumes: T7 `log`, `pages`
- Produces: `spike-assets/beats.wav`·`beats-test.mp4`·`beats-test.m4a`(180초, 1.000초부터 0.5초마다 1kHz 30ms 비프, T10도 쓴다)

- [ ] **Step 1: 이슈**

```bash
source ~/.kickoff-env && cd /c/project/KICKOFF && git switch spike/m0-lab
gh issue create --repo "$ORG/$REPO" --label spike --title "[$S_SP1] SP-1 파일·재생·화면 유지" --body "스펙 §11 SP-1 + 트리아지 T-11(길이 차이). 결과 PR(T15)이 닫는다."
```

- [ ] **Step 2 (👤): ffmpeg 설치**

```bash
winget install --id Gyan.FFmpeg -e
```

Git Bash를 새로 열고 `ffmpeg -version | head -1` → `ffmpeg version 9.x…`. **이미 떠 있는 Claude Code 세션은 새 PATH를 모른다.** 🤖가 ffmpeg을 쓰려면 👤가 세션을 닫고 `claude --continue`로 다시 열거나, 🤖 명령 앞에 `export PATH="$PATH:$(cygpath "$LOCALAPPDATA")/Microsoft/WinGet/Links"`를 붙인다. 확인: 🤖가 `command -v ffmpeg`를 실행해 경로가 나오는지 본다.

- [ ] **Step 3: 테스트 파일 생성기**

`spike-tools/gen-assets.sh`:

```bash
#!/usr/bin/env bash
# SP-1·SP-3 테스트 파일을 만든다. 직접 만든 클릭 트랙만 쓴다(상업 음원 금지).
# 박: 1.000초부터 0.5초마다(120 BPM), 1kHz 30ms 비프. 길이 180초.
set -euo pipefail
cd "$(dirname "$0")/.."
mkdir -p spike-assets
ffmpeg -hide_banner -loglevel error -y -f lavfi \
  -i "aevalsrc='if(gte(t,1)*lt(mod(t-1,0.5),0.03),0.8*sin(2*PI*1000*t),0)':s=48000:d=180" \
  -c:a pcm_s16le spike-assets/beats.wav
ffmpeg -hide_banner -loglevel error -y -f lavfi -i "testsrc2=s=640x360:r=30:d=180" -i spike-assets/beats.wav \
  -map 0:v -map 1:a -c:v libx264 -pix_fmt yuv420p -c:a aac -b:a 128k -ar 48000 -shortest spike-assets/beats-test.mp4
ffmpeg -hide_banner -loglevel error -y -i spike-assets/beats.wav -c:a aac -b:a 128k spike-assets/beats-test.m4a
for f in spike-assets/beats.wav spike-assets/beats-test.mp4 spike-assets/beats-test.m4a; do
  printf '%s  %ss\n' "$f" "$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$f")"
done
```

Run: `cd /c/project/KICKOFF && bash spike-tools/gen-assets.sh`
Expected (30초 남짓):

```
spike-assets/beats.wav  180.000000s
spike-assets/beats-test.mp4  180.000000s
spike-assets/beats-test.m4a  180.000000s
```

`spike-assets/`는 `.gitignore`에 있어 커밋되지 않는다(mp4 약 18MB).

- [ ] **Step 4: SP-1 페이지**

`web/src/sp1.tsx`:

```tsx
// SP-1: 파일 고르기, <video playsinline> 재생(숨긴 상태 포함), 배속과 음정 유지, Wake Lock, 재생 중 화면 꺼짐, 길이(duration) 차이.
import { useEffect, useRef, useState } from 'react'
import type { CSSProperties, ChangeEvent } from 'react'
import { log } from './log'

type Mode = 'visible' | 'none' | 'hidden' | 'tiny'
const MODES: [Mode, string][] = [
  ['visible', '보이기'],
  ['none', 'display:none'],
  ['hidden', 'visibility:hidden'],
  ['tiny', '1px 투명'],
]
const MODE_STYLE: Record<Mode, CSSProperties> = {
  visible: { width: '100%', maxHeight: 240, background: '#000' },
  none: { display: 'none' },
  hidden: { visibility: 'hidden', width: 160, height: 90 },
  tiny: { position: 'fixed', left: 0, bottom: 0, width: 1, height: 1, opacity: 0.01 },
}

function setPitch(v: HTMLVideoElement, on: boolean) {
  v.preservesPitch = on
  ;(v as HTMLVideoElement & { webkitPreservesPitch?: boolean }).webkitPreservesPitch = on
}

export default function Sp1() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const urlRef = useRef<string | null>(null)
  const nameRef = useRef('')
  const lockRef = useRef<WakeLockSentinel | null>(null)
  const [mode, setMode] = useState<Mode>('visible')
  const [pitch, setPitchState] = useState(true)
  const [elapsed, setElapsed] = useState(0)
  const [durations, setDurations] = useState<{ name: string; ms: number }[]>([])

  const requestLock = async () => {
    if (!('wakeLock' in navigator)) {
      log('Wake Lock 없음')
      return
    }
    try {
      const s = await navigator.wakeLock.request('screen')
      lockRef.current = s
      log('Wake Lock 획득')
      s.addEventListener('release', () => log('Wake Lock 해제됨'))
    } catch (e) {
      log(`Wake Lock 거부: ${String(e)}`)
    }
  }

  useEffect(() => {
    const v = videoRef.current!
    const on = (type: string, fn: () => void) => {
      v.addEventListener(type, fn)
      return () => v.removeEventListener(type, fn)
    }
    const offs = [
      on('loadedmetadata', () => {
        const ms = Number.isFinite(v.duration) ? Math.round(v.duration * 1000) : Number.NaN
        log(`길이 ${ms}ms, 영상 ${v.videoWidth}×${v.videoHeight}`)
        setDurations((d) => [...d, { name: nameRef.current, ms }])
      }),
      on('play', () => {
        log(`play (rate ${v.playbackRate})`)
        void requestLock()
      }),
      on('playing', () => log('playing')),
      on('pause', () => {
        log(`pause @${Math.round(v.currentTime * 1000)}ms`)
        void lockRef.current?.release()
      }),
      on('ended', () => log('ended')),
      on('waiting', () => log('waiting(버퍼링)')),
      on('ratechange', () => log(`ratechange → ${v.playbackRate}`)),
      on('error', () => log(`video error code=${v.error?.code} ${v.error?.message ?? ''}`)),
    ]
    const onVis = () => {
      log(`visibility → ${document.visibilityState}`)
      if (document.visibilityState === 'visible' && !v.paused) void requestLock()
    }
    document.addEventListener('visibilitychange', onVis)
    const timer = setInterval(() => setElapsed(v.paused ? 0 : Math.round(v.currentTime)), 1000)
    return () => {
      offs.forEach((off) => off())
      document.removeEventListener('visibilitychange', onVis)
      clearInterval(timer)
    }
  }, [])

  const onFile = (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    const v = videoRef.current!
    if (urlRef.current) URL.revokeObjectURL(urlRef.current)
    urlRef.current = URL.createObjectURL(f)
    nameRef.current = f.name
    v.src = urlRef.current
    setPitch(v, pitch)
    log(`파일 선택: ${f.name} type=${f.type || '(없음)'} size=${f.size}`)
    e.target.value = ''
  }

  const setRate = (r: number) => {
    const v = videoRef.current!
    v.playbackRate = r
    setPitch(v, pitch)
  }

  const first = durations[0]?.ms
  return (
    <div>
      <p>
        <input type="file" accept="video/*,audio/*" onChange={onFile} />
      </p>
      <p>
        표시 방식:{' '}
        {MODES.map(([m, label]) => (
          <label key={m} style={{ marginRight: 8 }}>
            <input
              type="radio"
              checked={mode === m}
              onChange={() => {
                setMode(m)
                log(`표시 방식 → ${label}`)
              }}
            />
            {label}
          </label>
        ))}
      </p>
      <video ref={videoRef} playsInline style={MODE_STYLE[mode]} />
      <p>
        <button onClick={() => void videoRef.current!.play().catch((e) => log(`play 실패: ${String(e)}`))}>재생</button>{' '}
        <button onClick={() => videoRef.current!.pause()}>정지</button>{' '}
        <button onClick={() => setRate(0.5)}>0.5배</button> <button onClick={() => setRate(0.75)}>0.75배</button>{' '}
        <button onClick={() => setRate(1)}>1배</button>{' '}
        <label>
          <input
            type="checkbox"
            checked={pitch}
            onChange={(e) => {
              setPitchState(e.target.checked)
              setPitch(videoRef.current!, e.target.checked)
              log(`음정 유지 → ${e.target.checked}`)
            }}
          />
          음정 유지
        </label>
      </p>
      <p style={{ fontSize: 32 }}>재생 위치 {elapsed}초</p>
      <p>
        관찰 기록: <button onClick={() => log('관찰: 소리 들림')}>소리 들림</button>{' '}
        <button onClick={() => log('관찰: 소리 안 들림')}>소리 안 들림</button>{' '}
        <button onClick={() => log('관찰: 화면 꺼짐')}>화면이 꺼졌음</button>{' '}
        <button onClick={() => log('관찰: 음정 변함')}>음정이 변함</button>
      </p>
      <h2>불러온 파일의 길이</h2>
      <table>
        <tbody>
          {durations.map((d, i) => (
            <tr key={i}>
              <td>{d.name}</td>
              <td>{d.ms}ms</td>
              <td>{first === undefined ? '' : `차이 ${d.ms - first}ms`}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
```

`web/src/main.tsx`에 두 줄을 더한다: import 줄 아래에 `import Sp1 from './sp1'`, `pages` 객체 안에 `'1': ['SP-1 파일·재생·화면 유지', Sp1],`.

- [ ] **Step 5: 빌드·푸시**

```bash
source ~/.kickoff-env && cd /c/project/KICKOFF/web && npm run build && cd .. && git add spike-tools/gen-assets.sh web/src && git commit -m "$S_SP1 chore(spike): SP-1 파일·재생·화면 유지

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>" && git push
```

- [ ] **Step 6 (👤): 테스트 파일을 폰으로 옮기고 내 폰에서 한 번 돌려 본다**

1. PC 카톡에서 나와의 채팅으로 `beats-test.mp4`를 **① 동영상(일반 화질) ② 동영상(고화질) ③ 파일**로 세 번, `beats-test.m4a`를 **④ 파일**로 보낸다. 폰에서 넷 다 저장한다. 파일 이름에 ①~④를 붙여 두면 결과표가 쉽다.
2. 내 폰에서 `…/?sp=1`을 열고 원본(③) mp4를 골라 [재생] → 소리와 "재생 위치"가 오르는지 본다. ①②④도 차례로 불러 "불러온 파일의 길이" 표가 채워지는지 본다.

Expected: 로그에 `길이 180000ms` 근처 값 4개. 본 측정은 T14에서 5개 환경 모두 한다.

---

### Task 9: SP-2 외부 브라우저로 열기

> 🤖 · 👤 내 폰 확인 · 모델: Opus 5.5 high · 0.25일 · Jira: `S_SP2`

**실무 관점:** 카톡 인앱에서 외부 브라우저로 넘기는 방법은 모두 비공식이다. 비공식 기법은 "지금 되는지"만 알 수 있고 내일은 모른다. 그래서 자동 탈출이 되더라도 **수동 안내(메뉴 경로)를 함께 두는 것**이 전제이고, 스파이크는 어느 쪽을 기본으로 보일지만 정한다.

**Files (브랜치 `spike/m0-lab`):**
- Create: `web/src/sp2.tsx`
- Modify: `web/src/main.tsx` (import 1줄, `pages` 1줄)

- [ ] **Step 1: 이슈**

```bash
source ~/.kickoff-env && cd /c/project/KICKOFF && git switch spike/m0-lab
gh issue create --repo "$ORG/$REPO" --label spike --title "[$S_SP2] SP-2 외부 브라우저로 열기" --body "스펙 §11 SP-2. 결과 PR(T15)이 닫는다."
```

- [ ] **Step 2: SP-2 페이지**

`web/src/sp2.tsx`:

```tsx
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
```

`web/src/main.tsx`: `import Sp2 from './sp2'`, `pages`에 `'2': ['SP-2 외부 브라우저로 열기', Sp2],`.

- [ ] **Step 3: 빌드·푸시·내 폰 확인**

```bash
source ~/.kickoff-env && cd /c/project/KICKOFF/web && npm run build && cd .. && git add web/src && git commit -m "$S_SP2 chore(spike): SP-2 외부 브라우저로 열기

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>" && git push
```

👤 카톡 나와의 채팅에서 `…/?sp=2`를 열고 내 폰 OS에 해당하는 방법을 눌러 본다. Expected: 외부 브라우저로 넘어가면 그 페이지에 "외부로 넘어와 연 페이지다"가 보인다. 다른 OS는 T14에서 한다.

---

### Task 10: SP-3 싱크 정확도 (시계 + 측정 파이프라인)

> 🤖 · 👤 리허설 · 모델: **Opus 5.5 xhigh**(🔺 싱크 엔진, 이슈 라벨 `model:xhigh`, 오케스트레이터가 직접) · 1일 · Jira: `S_SP3`

**실무 관점:** "±50ms"처럼 숫자가 걸린 요구는 **재는 방법부터 검증**해야 한다. 측정기가 틀리면 결론도 틀린다. 그래서 알려진 어긋남(+50ms)을 넣은 합성 영상으로 분석기가 그 값을 되찾는지 먼저 확인한다(Review Focus 5). 또 결과를 보고 규칙을 정하면 결과에 끌려가므로, 판정 규칙은 측정 전에 T15 표로 정해 둔다(사전 등록).

**Files (브랜치 `spike/m0-lab`):**
- Create: `web/src/clock.ts`, `web/src/clock.test.ts`, `web/src/sp3.tsx`
- Create: `spike-tools/wav.mjs`, `spike-tools/analyze-lib.mjs`, `spike-tools/analyze.mjs`, `spike-tools/onsets.mjs`, `spike-tools/analyze.test.mjs`
- Modify: `web/src/main.tsx` (import 1줄, `pages` 1줄)

**Interfaces:**
- Consumes: T8의 `spike-assets/beats-test.mp4`(1.000초부터 0.5초마다 비프)
- Produces: `createClock(): Clock` — `sample(currentTimeS, nowMs, playing, rate?) → ms`, `anchors: number`, `lastJumpMs: number | null`(스펙 §7.4 알고리즘의 첫 구현. M3가 참고한다). CLI `analyze.mjs <luma.txt> <audio.wav> [보정ms] [시작초]`

- [ ] **Step 1: 이슈**

```bash
source ~/.kickoff-env && cd /c/project/KICKOFF && git switch spike/m0-lab
gh issue create --repo "$ORG/$REPO" --label spike,model:xhigh --title "[$S_SP3] SP-3 싱크 정확도" --body "스펙 §11 SP-3, ±50ms 정의는 스펙 §8(트리아지 T-11). 결과 PR(T15)이 닫는다."
```

- [ ] **Step 2: 시계 테스트를 먼저 쓴다**

`web/src/clock.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { createClock } from './clock'

describe('createClock (스펙 §7.4)', () => {
  it('정지 중에는 currentTime을 그대로 돌려준다', () => {
    const c = createClock()
    expect(c.sample(1.5, 1000, false)).toBe(1500)
    expect(c.sample(1.5, 2000, false)).toBe(1500)
    expect(c.anchors).toBe(0)
  })

  it('재생을 시작한 뒤 currentTime이 처음 바뀌기 전에는 외삽하지 않는다', () => {
    const c = createClock()
    c.sample(2, 0, false)
    expect(c.sample(2, 100, true)).toBe(2000)
    expect(c.sample(2, 200, true)).toBe(2000)
  })

  it('currentTime이 바뀌면 앵커를 잡고 그 뒤는 performance.now()로 보간한다', () => {
    const c = createClock()
    c.sample(2, 0, false)
    expect(c.sample(2.25, 300, true)).toBe(2250)
    expect(c.sample(2.25, 316, true)).toBe(2266)
    expect(c.anchors).toBe(1)
  })

  it('재앵커 때 (실제 − 예측)을 lastJumpMs에 남긴다. 첫 앵커는 null이다', () => {
    const c = createClock()
    c.sample(0, 0, false)
    c.sample(0.1, 100, true)
    expect(c.lastJumpMs).toBeNull()
    c.sample(0.35, 340, true) // 예측 100 + 240 = 340, 실제 350
    expect(c.lastJumpMs).toBeCloseTo(10)
    expect(c.anchors).toBe(2)
  })

  it('정지하면 점프 기록을 지운다', () => {
    const c = createClock()
    c.sample(0, 0, false)
    c.sample(0.1, 100, true)
    c.sample(0.35, 340, true)
    c.sample(0.35, 400, false)
    expect(c.lastJumpMs).toBeNull()
  })

  it('재생 속도를 반영한다', () => {
    const c = createClock()
    c.sample(0, 0, false)
    c.sample(1, 1000, true, 0.5)
    expect(c.sample(1, 1200, true, 0.5)).toBe(1100)
  })
})
```

Run: `cd /c/project/KICKOFF/web && npx vitest run src/clock.test.ts`
Expected: FAIL — `Failed to resolve import "./clock"`

- [ ] **Step 3: 시계를 구현한다**

`web/src/clock.ts`:

```ts
// 스펙 §7.4 플레이헤드 시계. currentTime이 바뀔 때마다 앵커를 다시 잡고, 그 사이는 performance.now()로 보간한다.
// 정지 중이거나, 재생을 시작한 뒤 currentTime이 처음 바뀌기 전에는 외삽하지 않는다.
export interface Clock {
  /** rAF마다 부른다. 보간한 미디어 시각(ms)을 돌려준다. */
  sample(currentTimeS: number, nowMs: number, playing: boolean, rate?: number): number
  /** 지금까지 앵커를 잡은 횟수. */
  anchors: number
  /** 마지막 재앵커 때 (실제 − 예측) ms. 재생 뒤 첫 앵커면 null. */
  lastJumpMs: number | null
}

export function createClock(): Clock {
  let anchorMedia = 0
  let anchorPerf = 0
  let anchored = false
  let lastMedia = Number.NaN
  const clock: Clock = {
    anchors: 0,
    lastJumpMs: null,
    sample(currentTimeS, nowMs, playing, rate = 1) {
      const media = currentTimeS * 1000
      if (!playing) {
        anchored = false
        clock.lastJumpMs = null
        lastMedia = media
        return media
      }
      if (media !== lastMedia) {
        clock.lastJumpMs = anchored ? media - (anchorMedia + (nowMs - anchorPerf) * rate) : null
        anchorMedia = media
        anchorPerf = nowMs
        anchored = true
        lastMedia = media
        clock.anchors++
        return media
      }
      return anchored ? anchorMedia + (nowMs - anchorPerf) * rate : media
    },
  }
  return clock
}
```

Run: `cd /c/project/KICKOFF/web && npx vitest run src/clock.test.ts`
Expected: `6 passed`

- [ ] **Step 4: SP-3 페이지**

`web/src/sp3.tsx`:

```tsx
// SP-3: 싱크 측정. 앱 시계(스펙 §7.4 보간)가 박에 닿을 때마다 화면을 흰색으로 칠한다.
// 테스트 파일의 비프(1.000초부터 0.5초마다)와 흰 화면을 다른 폰으로 60fps 녹화해 어긋남을 잰다.
import { useEffect, useRef } from 'react'
import type { ChangeEvent } from 'react'
import { createClock } from './clock'
import { log } from './log'

const FIRST_BEAT_MS = 1000
const BEAT_MS = 500
const FLASH_MS = 60

export default function Sp3() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const flashRef = useRef<HTMLDivElement>(null)
  const readoutRef = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const v = videoRef.current!
    const clock = createClock()
    let raf = 0
    let seen = 0
    let windowStart = performance.now()
    let winAnchors = 0
    let winAbsSum = 0
    let winJumps = 0
    let winMax = 0
    let lock: WakeLockSentinel | null = null

    const onPlay = async () => {
      log(`play @${Math.round(v.currentTime * 1000)}ms`)
      try {
        lock = (await navigator.wakeLock?.request('screen')) ?? null
      } catch (e) {
        log(`Wake Lock 거부: ${String(e)}`)
      }
    }
    const onPause = () => {
      log(`pause @${Math.round(v.currentTime * 1000)}ms`)
      void lock?.release()
    }
    const onSeeked = () => log(`탐색 완료 → ${Math.round(v.currentTime * 1000)}ms`)
    v.addEventListener('play', onPlay)
    v.addEventListener('pause', onPause)
    v.addEventListener('seeked', onSeeked)

    const tick = (now: number) => {
      const playing = !v.paused && !v.ended && v.readyState >= 2
      const t = clock.sample(v.currentTime, now, playing, v.playbackRate)
      if (clock.anchors !== seen) {
        seen = clock.anchors
        winAnchors++
        if (clock.lastJumpMs !== null && !v.seeking) {
          winJumps++
          winAbsSum += Math.abs(clock.lastJumpMs)
          winMax = Math.max(winMax, Math.abs(clock.lastJumpMs))
        }
      }
      const since = t - FIRST_BEAT_MS
      const white = playing && since >= 0 && since % BEAT_MS < FLASH_MS
      flashRef.current!.style.background = white ? '#fff' : '#000'
      readoutRef.current!.textContent = `${Math.round(t)}ms`
      if (now - windowStart >= 10000) {
        if (playing) {
          const avg = winJumps ? (winAbsSum / winJumps).toFixed(1) : '-'
          log(`10초 통계 @${Math.round(t)}ms: 앵커 ${(winAnchors / 10).toFixed(1)}회/초, 재앵커 점프 평균 ${avg}ms 최대 ${winMax.toFixed(1)}ms`)
        }
        windowStart = now
        winAnchors = winAbsSum = winJumps = winMax = 0
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => {
      cancelAnimationFrame(raf)
      v.removeEventListener('play', onPlay)
      v.removeEventListener('pause', onPause)
      v.removeEventListener('seeked', onSeeked)
      void lock?.release()
    }
  }, [])

  const onFile = (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    videoRef.current!.src = URL.createObjectURL(f)
    log(`파일: ${f.name}`)
  }
  const seekTo = (ms: number) => {
    videoRef.current!.currentTime = ms / 1000
    log(`탐색 요청 → ${ms}ms`)
  }

  return (
    <div>
      <p>
        <input type="file" accept="video/*,audio/*" onChange={onFile} /> 기기 자동 잠금은 "안 함", 밝기는 최대로 둔다.
      </p>
      <p>
        <button onClick={() => void videoRef.current!.play().catch((e) => log(`play 실패: ${String(e)}`))}>재생</button>{' '}
        <button onClick={() => videoRef.current!.pause()}>정지</button>{' '}
        <button onClick={() => seekTo(0)}>처음으로</button> <button onClick={() => seekTo(90000)}>90초로 탐색</button>{' '}
        앱 시계 <span ref={readoutRef}>0ms</span>
      </p>
      <div ref={flashRef} style={{ width: '100%', height: '55vh', background: '#000' }} />
      <video ref={videoRef} playsInline style={{ width: 120, marginTop: 8 }} />
    </div>
  )
}
```

`web/src/main.tsx`: `import Sp3 from './sp3'`, `pages`에 `'3': ['SP-3 싱크 정확도', Sp3],`.

- [ ] **Step 5: 분석기 테스트를 먼저 쓴다**

`spike-tools/analyze.test.mjs`:

```js
// 사용법: node --test spike-tools/analyze.test.mjs
// 1) 순수 JS로 만든 가짜 녹화에서 알려진 어긋남(+50ms)을 되찾는지  2) ffmpeg이 있으면 실제 인코딩을 거친 합성 영상에서도 되찾는지.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'
import { flashOnsets, pairUp, parseLuma, stats } from './analyze-lib.mjs'
import { clickOnsets, readWav } from './wav.mjs'

const RATE = 48000
const BEATS = [1.0, 1.5, 2.0, 2.5]

function writeWav(path, samples) {
  const data = Buffer.alloc(samples.length * 2)
  samples.forEach((s, i) => data.writeInt16LE(s, i * 2))
  const h = Buffer.alloc(44)
  h.write('RIFF', 0)
  h.writeUInt32LE(36 + data.length, 4)
  h.write('WAVE', 8)
  h.write('fmt ', 12)
  h.writeUInt32LE(16, 16)
  h.writeUInt16LE(1, 20)
  h.writeUInt16LE(1, 22)
  h.writeUInt32LE(RATE, 24)
  h.writeUInt32LE(RATE * 2, 28)
  h.writeUInt16LE(2, 32)
  h.writeUInt16LE(16, 34)
  h.write('data', 36)
  h.writeUInt32LE(data.length, 40)
  writeFileSync(path, Buffer.concat([h, data]))
}

test('WAV의 비프 시작을 1ms 안으로 찾는다', () => {
  const samples = new Int16Array(RATE * 3)
  for (const b of BEATS) for (let i = 0; i < 0.03 * RATE; i++) samples[Math.round(b * RATE) + i] = Math.round(26000 * Math.sin((2 * Math.PI * 1000 * i) / RATE))
  const path = join(mkdtempSync(join(tmpdir(), 'sp3-')), 'beeps.wav')
  writeWav(path, samples)
  const { samples: read, sampleRate } = readWav(path)
  const onsets = clickOnsets(read, sampleRate)
  assert.equal(onsets.length, BEATS.length)
  onsets.forEach((t, k) => assert.ok(Math.abs(t - BEATS[k]) < 0.001, `${t} vs ${BEATS[k]}`))
})

test('60fps 밝기 기록에서 흰 화면 시작을 찾고, 비프와 짝지어 +50ms를 되찾는다', () => {
  let text = ''
  for (let n = 0; n < 180; n++) {
    const t = n / 60
    const white = BEATS.some((b) => t >= b + 0.05 - 1e-9 && t < b + 0.11)
    text += `frame:${n}    pts:${n * 1000}    pts_time:${t}\nlavfi.signalstats.YAVG=${white ? 235 : 16}.000000\n`
  }
  const flashes = flashOnsets(parseLuma(text))
  assert.equal(flashes.length, BEATS.length)
  const s = stats(pairUp(flashes, BEATS).map((r) => r.offsetMs))
  assert.equal(s.n, 4)
  assert.ok(Math.abs(s.mean - 50) < 17, `평균 ${s.mean}`)
})

const hasFfmpeg = spawnSync('ffmpeg', ['-version']).status === 0

test('ffmpeg 합성 영상(비프 1.000s+0.5k, 흰 화면 1.040s+0.5k)에서 +50ms(60fps 양자화)를 되찾는다', { skip: !hasFfmpeg && 'ffmpeg 없음' }, () => {
  const dir = mkdtempSync(join(tmpdir(), 'sp3-'))
  const run = (args) => {
    const r = spawnSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', ...args], { cwd: dir, encoding: 'utf8' })
    assert.equal(r.status, 0, r.stderr)
  }
  run([
    '-f', 'lavfi', '-i', 'color=c=black:s=320x240:r=60:d=20',
    '-f', 'lavfi', '-i', "aevalsrc='if(gte(t,1)*lt(mod(t-1,0.5),0.03),0.8*sin(2*PI*1000*t),0)':s=48000:d=20",
    '-vf', "drawbox=x=0:y=0:w=iw:h=ih:color=white:t=fill:enable='gte(t,1.04)*lt(mod(t-1.04,0.5),0.06)'",
    '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-shortest', 'synthetic.mp4',
  ])
  run(['-i', 'synthetic.mp4', '-vf', 'signalstats,metadata=print:key=lavfi.signalstats.YAVG:file=luma.txt', '-f', 'null', '-'])
  run(['-i', 'synthetic.mp4', '-vn', '-ac', '1', '-ar', '48000', '-c:a', 'pcm_s16le', 'audio.wav'])
  const flashes = flashOnsets(parseLuma(readFileSync(join(dir, 'luma.txt'), 'utf8')))
  const { samples, sampleRate } = readWav(join(dir, 'audio.wav'))
  const s = stats(pairUp(flashes, clickOnsets(samples, sampleRate)).map((r) => r.offsetMs))
  assert.ok(s.n >= 35, `짝 ${s.n}개`)
  assert.ok(s.mean > 45 && s.mean < 55, `평균 ${s.mean}ms (50 근처여야 한다)`)
  assert.ok(s.sd < 3, `표준편차 ${s.sd}ms`)
})
```

Run: `cd /c/project/KICKOFF && node --test spike-tools/analyze.test.mjs`
Expected: FAIL — `Cannot find module …analyze-lib.mjs`

- [ ] **Step 6: 분석기를 구현한다 (Review Focus 5)**

`spike-tools/wav.mjs`:

```js
// SP-3 분석용 WAV 읽기와 클릭 검출. 모노 16비트 PCM만 받는다(ffmpeg -ac 1 -c:a pcm_s16le).
import { readFileSync } from 'node:fs'

export function readWav(path) {
  const buf = readFileSync(path)
  if (buf.toString('ascii', 0, 4) !== 'RIFF' || buf.toString('ascii', 8, 12) !== 'WAVE') throw new Error('RIFF/WAVE가 아니다')
  let off = 12
  let fmt = null
  let data = null
  while (off + 8 <= buf.length) {
    const id = buf.toString('ascii', off, off + 4)
    const size = buf.readUInt32LE(off + 4)
    const body = off + 8
    if (id === 'fmt ') fmt = { format: buf.readUInt16LE(body), channels: buf.readUInt16LE(body + 2), rate: buf.readUInt32LE(body + 4), bits: buf.readUInt16LE(body + 14) }
    if (id === 'data') data = { start: body, size: Math.min(size, buf.length - body) }
    off = body + size + (size % 2)
  }
  if (!fmt || !data) throw new Error('fmt 또는 data 청크가 없다')
  if (fmt.format !== 1 || fmt.bits !== 16 || fmt.channels !== 1) throw new Error(`모노 16비트 PCM이 아니다: ${JSON.stringify(fmt)}`)
  const samples = new Int16Array(data.size / 2)
  for (let i = 0; i < samples.length; i++) samples[i] = buf.readInt16LE(data.start + i * 2)
  return { samples, sampleRate: fmt.rate }
}

/** 클릭 시작 시각(초). 파일 최대 진폭의 ratio를 처음 넘는 샘플이고, 그 뒤 minGapS 동안은 무시한다. */
export function clickOnsets(samples, sampleRate, ratio = 0.5, minGapS = 0.1) {
  let max = 0
  for (const s of samples) max = Math.max(max, Math.abs(s))
  const threshold = max * ratio
  const gap = Math.round(minGapS * sampleRate)
  const out = []
  let last = -gap
  for (let i = 0; i < samples.length; i++) {
    if (Math.abs(samples[i]) >= threshold && i - last >= gap) {
      out.push(i / sampleRate)
      last = i
    }
  }
  return out
}
```

`spike-tools/analyze-lib.mjs`:

```js
// SP-3 분석 로직. 녹화의 프레임 밝기(ffmpeg signalstats)에서 흰 화면 시작을, WAV에서 비프 시작을 찾아 짝짓는다.
// 어긋남 = 화면 − 소리(ms). 양수면 그림이 소리보다 늦다. 스펙 §8 정의: |어긋남| ≤ 50ms.

/** ffmpeg `metadata=print:key=lavfi.signalstats.YAVG` 출력을 [{t, y}]로 읽는다. */
export function parseLuma(text) {
  const frames = []
  let t = null
  for (const line of text.split(/\r?\n/)) {
    const pts = line.match(/pts_time:(-?[\d.]+)/)
    if (pts) {
      t = Number(pts[1])
      continue
    }
    const y = line.match(/lavfi\.signalstats\.YAVG=([\d.]+)/)
    if (y && t !== null) frames.push({ t, y: Number(y[1]) })
  }
  return frames
}

/** 밝기가 문턱(하위 5%와 상위 5% 밝기의 중간)을 아래에서 위로 넘는 프레임 시각들. */
export function flashOnsets(frames) {
  if (frames.length < 2) return []
  const ys = frames.map((f) => f.y).sort((a, b) => a - b)
  const threshold = (ys[Math.floor(ys.length * 0.05)] + ys[Math.floor(ys.length * 0.95)]) / 2
  const out = []
  for (let i = 1; i < frames.length; i++) if (frames[i - 1].y < threshold && frames[i].y >= threshold) out.push(frames[i].t)
  return out
}

/** 흰 화면마다 가장 가까운 비프를 짝짓는다(maxGapS 안에서). */
export function pairUp(flashes, clicks, maxGapS = 0.25) {
  const rows = []
  for (const f of flashes) {
    let best = null
    for (const c of clicks) if (best === null || Math.abs(c - f) < Math.abs(best - f)) best = c
    if (best !== null && Math.abs(best - f) <= maxGapS) rows.push({ flash: f, click: best, offsetMs: (f - best) * 1000 })
  }
  return rows
}

export function stats(values) {
  const n = values.length
  if (!n) return { n: 0, mean: NaN, sd: NaN, min: NaN, max: NaN }
  const mean = values.reduce((a, b) => a + b, 0) / n
  const sd = Math.sqrt(values.reduce((a, b) => a + (b - mean) ** 2, 0) / n)
  return { n, mean, sd, min: Math.min(...values), max: Math.max(...values) }
}
```

`spike-tools/analyze.mjs`:

```js
// 사용법: node spike-tools/analyze.mjs <luma.txt> <audio.wav> [녹화 폰 보정 ms] [분석 시작초]
// 녹화 폰 보정 ms = (손뼉 영상 시각 − 손뼉 소리 시각) × 1000. 모든 어긋남에서 뺀다.
// 분석 시작초: 손뼉이 끝난 뒤 시각. 손뼉이 비프보다 커서 문턱을 올려 버리는 것을 막는다.
import { readFileSync } from 'node:fs'
import { flashOnsets, pairUp, parseLuma, stats } from './analyze-lib.mjs'
import { clickOnsets, readWav } from './wav.mjs'

const [lumaPath, wavPath, avArg = '0', startArg = '0'] = process.argv.slice(2)
if (!lumaPath || !wavPath) {
  console.error('사용법: node spike-tools/analyze.mjs <luma.txt> <audio.wav> [녹화 폰 보정 ms] [분석 시작초]')
  process.exit(1)
}
const av = Number(avArg)
const start = Number(startArg)
const flashes = flashOnsets(parseLuma(readFileSync(lumaPath, 'utf8')).filter((f) => f.t >= start))
const { samples, sampleRate } = readWav(wavPath)
const a = Math.floor(start * sampleRate)
const clicks = clickOnsets(samples.subarray(a), sampleRate).map((t) => t + a / sampleRate)
const rows = pairUp(flashes, clicks).map((r) => ({ ...r, offsetMs: r.offsetMs - av }))
for (const r of rows) console.log(`화면 ${r.flash.toFixed(3)}s  소리 ${r.click.toFixed(3)}s  어긋남 ${r.offsetMs >= 0 ? '+' : ''}${r.offsetMs.toFixed(1)}ms`)
const all = stats(rows.map((r) => r.offsetMs))
const pass = rows.filter((r) => Math.abs(r.offsetMs) <= 50).length
console.log(`\n흰 화면 ${flashes.length}개, 비프 ${clicks.length}개, 짝 ${all.n}개, 보정 ${av}ms, 시작 ${start}s`)
console.log(`평균 ${all.mean.toFixed(1)}ms, 표준편차 ${all.sd.toFixed(1)}ms, 최소 ${all.min.toFixed(1)}ms, 최대 ${all.max.toFixed(1)}ms`)
console.log(`|어긋남| ≤ 50ms: ${pass}/${all.n}`)
for (let i = 0; i < rows.length; i += 20) {
  const s = stats(rows.slice(i, i + 20).map((r) => r.offsetMs))
  console.log(`  ${rows[i].flash.toFixed(0)}s부터 20개: 평균 ${s.mean.toFixed(1)}ms, 최대 |어긋남| ${Math.max(Math.abs(s.min), Math.abs(s.max)).toFixed(1)}ms`)
}
```

`spike-tools/onsets.mjs`:

```js
// 사용법: node spike-tools/onsets.mjs <audio.wav> [시작초] [끝초]
// 구간 안의 클릭(비프·손뼉) 시작 시각을 출력한다. 문턱은 그 구간의 최대 진폭 기준이다. 생성 파일 확인과 손뼉 보정에 쓴다.
import { clickOnsets, readWav } from './wav.mjs'

const [path, from = '0', to] = process.argv.slice(2)
if (!path) {
  console.error('사용법: node spike-tools/onsets.mjs <audio.wav> [시작초] [끝초]')
  process.exit(1)
}
const { samples, sampleRate } = readWav(path)
const a = Math.max(0, Math.floor(Number(from) * sampleRate))
const b = to === undefined ? samples.length : Math.min(samples.length, Math.floor(Number(to) * sampleRate))
const onsets = clickOnsets(samples.subarray(a, b), sampleRate).map((t) => t + a / sampleRate)
console.log(`${onsets.length}개: ${onsets.slice(0, 10).map((t) => t.toFixed(4)).join(', ')}${onsets.length > 10 ? ' …' : ''}`)
if (onsets.length > 1) console.log(`마지막: ${onsets[onsets.length - 1].toFixed(4)}`)
```

Run: `cd /c/project/KICKOFF && node --test spike-tools/analyze.test.mjs`
Expected: `pass 3`, `skipped 0`. 세 번째 테스트(ffmpeg 합성 영상)는 실제 H.264·AAC 인코딩을 거친 뒤에도 +50ms를 되찾는지 본다. `skipped 1`이면 이 세션의 PATH에 ffmpeg이 없는 것이다. T8 Step 2의 "세션 PATH" 안내를 따른다.

- [ ] **Step 7: 생성 파일의 비프 위치를 확인한다**

```bash
cd /c/project/KICKOFF
node spike-tools/onsets.mjs spike-assets/beats.wav
ffmpeg -hide_banner -loglevel error -y -i spike-assets/beats-test.mp4 -vn -ac 1 -ar 48000 -c:a pcm_s16le spike-assets/decoded.wav && node spike-tools/onsets.mjs spike-assets/decoded.wav
```

Expected: 두 번 모두 `358개: 1.0001, 1.5001, 2.0001, …`, `마지막: 179.5001`. (mp4를 ffmpeg이 풀 때는 AAC 프라이밍을 편집 목록으로 빼 준다. 브라우저가 그러는지가 SP-3에서 잴 것이다.)

- [ ] **Step 8: 커밋·푸시**

```bash
source ~/.kickoff-env && cd /c/project/KICKOFF/web && npm test && npm run build && cd .. && git add web/src spike-tools && git commit -m "$S_SP3 chore(spike): SP-3 시계와 싱크 측정 도구

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>" && git push
```

- [ ] **Step 9 (👤): 측정 절차 리허설 (1분)**

기기 세션(T14)에서 쓰는 절차를 내 폰 두 대(또는 PC 화면 + 폰)로 1분만 미리 해 본다.

**측정 절차 (트리아지 §3):**
1. **측정 기기(DUT):** `…/?sp=3`을 열고 `beats-test.mp4`(원본)를 고른다. 자동 잠금 "안 함", 밝기 최대, 소리 크게. 내장 스피커로 잰다(유선 이어폰이면 이어폰을 녹화 폰 마이크에 가까이).
2. **녹화 폰:** 60fps 동영상, 흰 영역이 화면 대부분을 채우게 고정한다. 조용한 곳에서.
3. 녹화 시작 → 카메라 앞에서 **손뼉 한 번**(손이 보이게) → 2초 쉬고 DUT에서 [재생] → 3분 끝까지(시작·중간·끝). 이어서 [정지] → [90초로 탐색] → [재생] 20초(탐색 직후). 녹화 끝.
4. 녹화 파일을 **USB나 클라우드 원본 업로드로** PC `spike-assets/`에 옮긴다. 카톡 전송은 다시 인코딩해 영상·소리 어긋남이 바뀌므로 쓰지 않는다. 파일 이름 예: `rec-E1.mp4`.

**분석:**

```bash
cd /c/project/KICKOFF/spike-assets
R=rec-E1   # 녹화 파일 이름(확장자 뺀 것)
ffmpeg -hide_banner -loglevel error -y -i $R.mp4 -vf "signalstats,metadata=print:key=lavfi.signalstats.YAVG:file=$R-luma.txt" -f null -
ffmpeg -hide_banner -loglevel error -y -i $R.mp4 -vn -ac 1 -ar 48000 -c:a pcm_s16le $R.wav
node ../spike-tools/onsets.mjs $R.wav 0 3          # 손뼉 소리 시각(첫 값)을 적는다 → CLAP_A
ffmpeg -hide_banner -loglevel error -y -ss <CLAP_A − 0.5> -i $R.mp4 -t 1 -vf fps=60 $R-clap-%03d.png
```

`$R-clap-NNN.png`를 넘겨 보며 **손이 처음 닿은 번호 N**을 찾는다. 손뼉 영상 시각 `CLAP_V = (CLAP_A − 0.5) + (N − 1)/60`, 보정 `AV = (CLAP_V − CLAP_A) × 1000`(ms). 그다음:

```bash
node ../spike-tools/analyze.mjs $R-luma.txt $R.wav <AV> <손뼉 뒤 1초쯤의 시각>
```

Expected(리허설): `흰 화면 N개, 비프 N개, 짝 N개`와 평균·표준편차·최대, `|어긋남| ≤ 50ms: a/b`, 20개 구간별 평균. **짝이 0개면** 분석 시작초가 손뼉보다 앞인지(손뼉이 비프보다 커서 문턱을 올린다), 흰 영역이 화면을 채웠는지 본다. 60fps 녹화라 한 측정의 분해능은 약 ±17ms다.

---

### Task 11: SP-4 카카오 로그인

> 🤖 · 👤 로그인 시험, 필요하면 비즈 앱 전환 · 모델: **Opus 5.5 xhigh**(🔺 권한·인증, 라벨 `model:xhigh`) · 0.5일 · Jira: `S_SP4`

**실무 관점:** 로그인은 "우리 코드"보다 "남의 설정"(카카오 동의항목, Supabase 공급자)에 더 많이 기댄다. 조사로 Supabase가 이메일 scope를 **항상** 요청한다는 것을 소스에서 확인했으므로, 비즈 앱 전환 없이는 KOE205가 날 가능성이 크다. 가설을 먼저 적고, 실험으로 확인하고, 실패하면 무엇을 할지(비즈 앱 전환)까지 미리 정해 둔다.

**Files (브랜치 `spike/m0-lab`):**
- Create: `web/src/sp4.tsx`
- Modify: `web/src/main.tsx` (import 1줄, `pages` 1줄)

**Interfaces:**
- Consumes: T6의 Pages Preview 변수 `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, Supabase 리다이렉트 허용 목록
- Produces: 결과 항목(scope, KOE205 여부, 동의 거부 가입, 인앱 복귀, alg, Supabase Auth에 저장되는 항목) → T15

- [ ] **Step 1: 이슈**

```bash
source ~/.kickoff-env && cd /c/project/KICKOFF && git switch spike/m0-lab
gh issue create --repo "$ORG/$REPO" --label spike,model:xhigh --title "[$S_SP4] SP-4 카카오 로그인" --body "스펙 §11 SP-4(트리아지 T-08로 user_metadata 키 확인은 뺐다). 결과 PR(T15)이 닫는다."
```

- [ ] **Step 2: SP-4 페이지**

`web/src/sp4.tsx`:

```tsx
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
```

`web/src/main.tsx`: `import Sp4 from './sp4'`, `pages`에 `'4': ['SP-4 카카오 로그인', Sp4],`.

- [ ] **Step 3: 빌드·푸시**

```bash
source ~/.kickoff-env && cd /c/project/KICKOFF/web && npm run build && cd .. && git add web/src && git commit -m "$S_SP4 chore(spike): SP-4 카카오 로그인

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>" && git push
```

- [ ] **Step 4: 카카오로 가는 scope를 PC에서 본다**

PC 브라우저로 `…/?sp=4`를 열고 [authorize URL 보기] → 로그에 찍힌 URL을 복사해:

```bash
curl -s -o /dev/null -w '%{redirect_url}\n' '<authorize URL>'
```

Expected: `https://kauth.kakao.com/oauth/authorize?…scope=account_email+profile_image+profile_nickname…` 형태. 요청 scope를 결과표에 적는다(가설: 이메일 포함).

- [ ] **Step 5 (👤): 시험 A — 비즈 앱 전환 없이 (PC 브라우저, 내 계정)**

[카카오로 로그인]을 누른다.
- 카카오 화면에 **KOE205**가 뜨면: 가설 확인. 화면을 찍어 두고 Step 6으로 간다.
- 동의 화면이 뜨면: 선택 항목을 모두 끄고 동의 → `?sp=4`로 돌아와 `SP-4 결과`가 찍히는지 본다. 결과를 결과표에 적고 Step 7로 간다.

- [ ] **Step 6 (👤, 시험 A가 KOE205일 때만): 개인 개발자 비즈 앱 전환 뒤 시험 B**

카카오 디벨로퍼스 → 앱 → 비즈니스(또는 앱 설정의 비즈니스 정보) → **개인 개발자 비즈 앱** 전환(본인인증). 동의항목에서 카카오계정(이메일)을 **선택 동의**로 켠다(닉네임 필수, 사진 선택은 그대로). 스펙 §7.1 2번·§12가 예정한 경로다. 그다음 시험 A를 다시 한다. `docs/ops/external-services.md`의 카카오 행은 T15 결과 PR에서 고친다.

- [ ] **Step 7 (👤): 연결 끊고 "선택 동의 모두 거부"를 다시 확인**

카카오톡 → 설정 → 카카오계정 → 연결된 서비스 관리 → 이 앱 → 연결 끊기. Supabase → Authentication → Users에서 방금 생긴 사용자를 지운다. 다시 로그인하며 선택 항목을 모두 끈다.
Expected: 가입이 된다(`auth 이벤트: SIGNED_IN`, `emailPresent:false`). 안 되면 오류 문구를 결과표에 적는다. 카톡 인앱(iOS·Android) 복귀는 T14에서 잰다.

---

### Task 12: SP-5a 무대 손맛

> 🤖 · 👤 내 폰 확인 · 모델: Opus 5.5 high · 0.75일 · Jira: `S_SP5`

**실무 관점:** "폰 세로에서 편집이 되느냐"는 스펙이 핀치 줌(S-11)을 Must로 올릴지를 가르는 질문이다. 느낌으로 답하면 choreography처럼 시뮬레이터를 보며 설계를 계속 바꾸게 된다. 그래서 **세는 것**(오터치 횟수, 드래그 수)과 **판정 버튼**을 페이지에 넣고, 판정 규칙은 T15 표로 미리 정한다.

**Files (브랜치 `spike/m0-lab`):**
- Create: `web/src/sp5-rules.ts`, `web/src/sp5-rules.test.ts`, `web/src/sp5-stage.tsx`
- Modify: `web/src/main.tsx` (import 1줄, `pages` 1줄)

**Interfaces:**
- Produces: `initialPos(i, cols, rows, spread) → Pos`, `snap(v, cells) → number`, `isBackstage(p, cols) → boolean`, 타입 `Pos = {x, y}`. 트리아지 §2 비켜 놓기 규칙의 실측 근거가 된다.

- [ ] **Step 1: 이슈**

```bash
source ~/.kickoff-env && cd /c/project/KICKOFF && git switch spike/m0-lab
gh issue create --repo "$ORG/$REPO" --label spike --title "[$S_SP5] SP-5 손맛(무대·타임라인)" --body "스펙 §11 SP-5 + 트리아지 T-11. T12(무대)와 T13(타임라인·저장 시간)이 쓴다. 결과 PR(T15)이 닫는다."
```

- [ ] **Step 2: 무대 규칙 테스트를 먼저 쓴다**

`web/src/sp5-rules.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { initialPos, isBackstage, snap } from './sp5-rules'

describe('snap (§7.3)', () => {
  it('rows=8에서 1.1 근처는 범위 안의 마지막 교차점(1.0625)에 붙는다', () => {
    expect(snap(1.2, 8)).toBe(1.0625)
    expect(snap(1.09, 8)).toBe(1.0625)
  })
  it('−0.1보다 바깥은 범위 안의 첫 교차점에 붙는다', () => {
    const v = snap(-0.5, 16)
    expect(v).toBeGreaterThanOrEqual(-0.1)
    expect(v).toBeLessThan(-0.09)
  })
  it('안쪽 값은 가장 가까운 0.5칸 교차점에 붙는다', () => {
    expect(snap(0.51, 16)).toBe(0.5)
    expect(snap(0.52, 16)).toBe(0.5313)
  })
})

describe('isBackstage (트리아지 T-03)', () => {
  it('cols=21 경계선 위(반올림한 1/21)는 무대다', () => {
    expect(isBackstage({ x: Math.round((1 / 21) * 1e4) / 1e4, y: 0.5 }, 21)).toBe(false)
    expect(isBackstage({ x: Math.round((1 - 1 / 21) * 1e4) / 1e4, y: 0.5 }, 21)).toBe(false)
  })
  it('끝 열 안과 0~1 밖은 백스테이지다', () => {
    expect(isBackstage({ x: 0.5 / 21, y: 0.5 }, 21)).toBe(true)
    expect(isBackstage({ x: 0.5, y: 1.05 }, 21)).toBe(true)
  })
})

describe('initialPos 비켜 놓기 (트리아지 §2)', () => {
  it('모든 격자 × 50명에서 좌표가 겹치지 않고, −0.1~1.1 안이며, 백스테이지다', () => {
    for (let cols = 6; cols <= 24; cols++) {
      for (let rows = 4; rows <= 16; rows++) {
        const seen = new Set<string>()
        for (let i = 0; i < 50; i++) {
          const p = initialPos(i, cols, rows, true)
          expect(p.x).toBeGreaterThanOrEqual(-0.1)
          expect(p.x).toBeLessThanOrEqual(1.1)
          expect(isBackstage(p, cols)).toBe(true)
          seen.add(`${p.x},${p.y}`)
        }
        expect(seen.size).toBe(50)
      }
    }
  })
  it('비켜 놓지 않으면 2·rows명마다 같은 자리에 겹친다(현행 스펙)', () => {
    expect(initialPos(16, 16, 8, false)).toEqual(initialPos(0, 16, 8, false))
  })
})
```

Run: `cd /c/project/KICKOFF/web && npx vitest run src/sp5-rules.test.ts`
Expected: FAIL — `Failed to resolve import "./sp5-rules"`

- [ ] **Step 3: 규칙을 구현한다**

`web/src/sp5-rules.ts`:

```ts
// SP-5 무대 규칙(스펙 §5.3·§7.3, 트리아지 T-03·§2)을 스파이크용으로 옮긴 것. 제품 코드가 아니다.
export type Pos = { x: number; y: number }

const round4 = (v: number) => Math.round(v * 1e4) / 1e4

/** 새 댄서 i의 자리(§7.3). spread면 트리아지 §2 비켜 놓기: 바퀴 k마다 x를 바깥쪽으로 k/60. */
export function initialPos(i: number, cols: number, rows: number, spread: boolean): Pos {
  const s = i % (2 * rows)
  const off = spread ? Math.floor(i / (2 * rows)) / 60 : 0
  return s < rows
    ? { x: round4(0.5 / cols - off), y: round4((s + 0.5) / rows) }
    : { x: round4(1 - 0.5 / cols + off), y: round4((s - rows + 0.5) / rows) }
}

/** −0.1~1.1 안의 0.5칸 교차점 가운데 가장 가까운 점(§7.3 토큰 드래그). */
export function snap(v: number, cells: number): number {
  const step = 0.5 / cells
  const lo = Math.ceil(-0.1 / step - 1e-9)
  const hi = Math.floor(1.1 / step + 1e-9)
  return round4(Math.min(Math.max(Math.round(v / step), lo), hi) * step)
}

/** 백스테이지 판정(§5.3 + 트리아지 T-03: 경계선 위는 무대). */
export function isBackstage(p: Pos, cols: number): boolean {
  return p.x < 1 / cols - 1e-4 || p.x > 1 - 1 / cols + 1e-4 || p.y < 0 || p.y > 1
}
```

Run: `cd /c/project/KICKOFF/web && npx vitest run src/sp5-rules.test.ts`
Expected: `7 passed`. 셋째 묶음의 첫 테스트가 트리아지 §2의 실측(모든 격자 × 50명에서 겹침 없음, 범위 안, 백스테이지)을 코드로 다시 확인한다.

- [ ] **Step 4: 무대 페이지**

`web/src/sp5-stage.tsx`:

```tsx
// SP-5a: 폰 세로 무대에서 토큰 드래그의 손맛. 토큰 크기·라벨·겹침 비켜 놓기를 바꿔 가며 오터치를 센다.
// 드래그 중에는 상태를 바꾸지 않고 DOM만 움직인다(트리아지 T-03: 손을 뗄 때 한 번만 반영).
import { useEffect, useRef, useState } from 'react'
import type { PointerEvent as RPointerEvent } from 'react'
import { log } from './log'
import { initialPos, isBackstage, snap } from './sp5-rules'
import type { Pos } from './sp5-rules'

type LabelMode = 'first2' | 'last2' | 'num'
const PRESETS = [
  { label: '16×8 · 20명', cols: 16, rows: 8, n: 20 },
  { label: '6×4 · 50명', cols: 6, rows: 4, n: 50 },
]
const PALETTE = ['#E4572E', '#17BEBB', '#C9A227', '#2E282A', '#76B041', '#7B2CBF', '#F15BB5', '#0081A7', '#9C6644', '#5C677D']
// 비슷한 이름(김서연·김서윤·김서현)을 일부러 넣어 라벨 구분을 시험한다.
const NAMES = [
  '김서연', '김서윤', '김서현', '이지우', '이지민', '박민준', '박민서', '최하은', '최하윤', '정도윤',
  '정도현', '강서준', '조예린', '윤지호', '장수아', '임채원', '한유진', '오시우', '서예준', '신지안',
  '권하린', '황민재', '안소율', '송태윤', '전가은', '홍지아', '유건우', '고나연', '문시아', '양준서',
  '손다인', '배로아', '백승현', '허윤서', '남민호', '노하진', '하은호', '곽서아', '성지유', '차은우',
  '주아린', '우도하', '구민성', '민소윤', '류하준', '나윤아', '진서우', '엄지후', '채다은', '원시현',
]

export default function Sp5Stage() {
  const [presetIdx, setPresetIdx] = useState(0)
  const { cols, rows, n, label: presetLabel } = PRESETS[presetIdx]
  const [count, setCount] = useState(n)
  const [labelMode, setLabelMode] = useState<LabelMode>('first2')
  const [defaultNames, setDefaultNames] = useState(false)
  const [nameTag, setNameTag] = useState(true)
  const [spread, setSpread] = useState(false)
  const [scale, setScale] = useState(1)
  const [pos, setPos] = useState<Record<number, Pos>>({})
  const [width, setWidth] = useState(0)
  const stageRef = useRef<HTMLDivElement>(null)
  const grab = useRef<{ i: number; dx: number; dy: number; t0: number; from: Pos } | null>(null)
  const counts = useRef({ wrong: 0, missed: 0, drags: 0 })

  useEffect(() => {
    const el = stageRef.current!
    const ro = new ResizeObserver(() => setWidth(el.clientWidth))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const choosePreset = (idx: number) => {
    setPresetIdx(idx)
    setCount(PRESETS[idx].n)
    setPos({})
    counts.current = { wrong: 0, missed: 0, drags: 0 }
    log(`프리셋 → ${PRESETS[idx].label}`)
  }

  const cell = width / 1.2 / cols
  const dia = Math.min(Math.max(cell * 0.85 * scale, 20), 44)
  const hit = dia + 12
  const at = (i: number) => pos[i] ?? initialPos(i, cols, rows, spread)
  const name = (i: number) => (defaultNames ? `댄서 ${i + 1}` : NAMES[i % NAMES.length])
  const label = (i: number) =>
    labelMode === 'num' ? String(i + 1) : labelMode === 'last2' ? name(i).slice(-2) : name(i).slice(0, 2)
  const toPct = (p: Pos) => ({ left: `${((p.x + 0.1) / 1.2) * 100}%`, top: `${((p.y + 0.1) / 1.2) * 100}%` })
  const toCoord = (e: RPointerEvent) => {
    const r = stageRef.current!.getBoundingClientRect()
    return { x: ((e.clientX - r.left) / r.width) * 1.2 - 0.1, y: ((e.clientY - r.top) / r.height) * 1.2 - 0.1 }
  }

  const down = (e: RPointerEvent<HTMLDivElement>, i: number) => {
    e.currentTarget.setPointerCapture(e.pointerId)
    const c = toCoord(e)
    const p = at(i)
    grab.current = { i, dx: c.x - p.x, dy: c.y - p.y, t0: performance.now(), from: p }
    e.currentTarget.style.zIndex = '1000'
  }
  const move = (e: RPointerEvent<HTMLDivElement>) => {
    const g = grab.current
    if (!g) return
    const c = toCoord(e)
    Object.assign(e.currentTarget.style, toPct({ x: c.x - g.dx, y: c.y - g.dy }))
  }
  const up = (e: RPointerEvent<HTMLDivElement>) => {
    const g = grab.current
    if (!g) return
    grab.current = null
    const c = toCoord(e)
    const s = { x: snap(c.x - g.dx, cols), y: snap(c.y - g.dy, rows) }
    Object.assign(e.currentTarget.style, toPct(s), { zIndex: '' })
    setPos((prev) => ({ ...prev, [g.i]: s }))
    counts.current.drags++
    const ms = Math.round(performance.now() - g.t0)
    log(`드래그 ${name(g.i)}: (${g.from.x}, ${g.from.y}) → (${s.x}, ${s.y}) ${ms}ms${isBackstage(s, cols) ? ' [백스테이지]' : ''}`)
  }
  const cancel = (e: RPointerEvent<HTMLDivElement>) => {
    const g = grab.current
    if (!g) return
    grab.current = null
    Object.assign(e.currentTarget.style, toPct(g.from), { zIndex: '' })
    log(`드래그 취소 ${name(g.i)}`)
  }
  const tally = (kind: 'wrong' | 'missed', text: string) => {
    counts.current[kind]++
    log(`${text} ${counts.current[kind]}회 / 드래그 ${counts.current.drags}회 (${presetLabel}, 배율 ${scale}, 라벨 ${labelMode})`)
  }

  return (
    <div>
      <p>
        {PRESETS.map((p, idx) => (
          <button key={p.label} onClick={() => choosePreset(idx)} disabled={idx === presetIdx}>
            {p.label}
          </button>
        ))}{' '}
        <button
          onClick={() => {
            setCount(count + 1)
            log(`댄서 추가 → ${count + 1}명`)
          }}
          disabled={count >= 50}
        >
          +댄서
        </button>{' '}
        {count}명
      </p>
      <p>
        라벨{' '}
        <select
          value={labelMode}
          onChange={(e) => {
            setLabelMode(e.target.value as LabelMode)
            log(`라벨 → ${e.target.value}`)
          }}
        >
          <option value="first2">이름 앞 2글자</option>
          <option value="last2">이름 뒤 2글자</option>
          <option value="num">번호</option>
        </select>{' '}
        <label>
          <input type="checkbox" checked={defaultNames} onChange={(e) => setDefaultNames(e.target.checked)} />
          기본 이름("댄서 N")
        </label>{' '}
        <label>
          <input type="checkbox" checked={nameTag} onChange={(e) => setNameTag(e.target.checked)} />
          아래 이름표
        </label>{' '}
        <label>
          <input
            type="checkbox"
            checked={spread}
            onChange={(e) => {
              setSpread(e.target.checked)
              setPos({})
              log(`비켜 놓기 → ${e.target.checked}`)
            }}
          />
          겹침 비켜 놓기
        </label>{' '}
        배율{' '}
        <input
          type="range"
          min={0.6}
          max={1.3}
          step={0.1}
          value={scale}
          onChange={(e) => {
            setScale(Number(e.target.value))
            log(`배율 → ${e.target.value}`)
          }}
        />{' '}
        지름 {Math.round(dia)}px
      </p>
      <div
        ref={stageRef}
        style={{
          position: 'relative',
          width: '100%',
          aspectRatio: `${cols} / ${rows}`,
          background: '#3a3a3a',
          touchAction: 'none',
          userSelect: 'none',
          WebkitUserSelect: 'none',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute',
            left: `${(0.1 / 1.2) * 100}%`,
            top: `${(0.1 / 1.2) * 100}%`,
            width: `${100 / 1.2}%`,
            height: `${100 / 1.2}%`,
            background: '#f4f1ea',
            backgroundImage:
              'linear-gradient(to right, #ccc 1px, transparent 1px), linear-gradient(to bottom, #ccc 1px, transparent 1px)',
            backgroundSize: `${100 / cols}% ${100 / rows}%`,
          }}
        >
          <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${100 / cols}%`, background: 'rgba(0,0,0,0.15)' }} />
          <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: `${100 / cols}%`, background: 'rgba(0,0,0,0.15)' }} />
          <div style={{ position: 'absolute', bottom: 2, width: '100%', textAlign: 'center', fontSize: 11, color: '#888' }}>관객석 (앞)</div>
        </div>
        {Array.from({ length: count }, (_, i) => {
          const p = at(i)
          return (
            <div
              key={i}
              onPointerDown={(e) => down(e, i)}
              onPointerMove={move}
              onPointerUp={up}
              onPointerCancel={cancel}
              style={{ position: 'absolute', ...toPct(p), width: hit, height: hit, marginLeft: -hit / 2, marginTop: -hit / 2, display: 'grid', placeItems: 'center' }}
            >
              <div
                style={{
                  width: dia,
                  height: dia,
                  borderRadius: '50%',
                  background: PALETTE[i % PALETTE.length],
                  opacity: isBackstage(p, cols) ? 0.6 : 1,
                  color: '#fff',
                  fontSize: Math.max(9, dia * 0.36),
                  fontWeight: 700,
                  display: 'grid',
                  placeItems: 'center',
                  lineHeight: 1,
                }}
              >
                {label(i)}
              </div>
              {nameTag && (
                <div style={{ position: 'absolute', top: '100%', fontSize: 10, whiteSpace: 'nowrap', color: '#111', pointerEvents: 'none' }}>
                  {name(i)}
                </div>
              )}
            </div>
          )
        })}
      </div>
      <p>
        <button onClick={() => tally('wrong', '다른 토큰이 잡힘')}>다른 토큰이 잡힘 +1</button>{' '}
        <button onClick={() => tally('missed', '안 잡힘')}>안 잡힘 +1</button>{' '}
        <button onClick={() => log(`판정: 폰 세로 편집 가능 (${presetLabel}, 배율 ${scale}, 라벨 ${labelMode})`)}>편집 가능</button>{' '}
        <button onClick={() => log(`판정: 폰 세로 편집 불가 (${presetLabel}, 배율 ${scale}, 라벨 ${labelMode})`)}>편집 불가</button>
      </p>
    </div>
  )
}
```

`web/src/main.tsx`: `import Sp5Stage from './sp5-stage'`, `pages`에 `'5a': ['SP-5a 무대 손맛', Sp5Stage],`.

- [ ] **Step 5: 빌드·푸시·내 폰 확인**

```bash
source ~/.kickoff-env && cd /c/project/KICKOFF/web && npm test && npm run build && cd .. && git add web/src && git commit -m "$S_SP5 chore(spike): SP-5a 무대 손맛

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>" && git push
```

👤 내 폰 세로로 `…/?sp=5a`를 열어 토큰 몇 개를 백스테이지에서 무대로 끌어 본다. Expected: 손을 떼면 0.5칸 교차점에 붙고, 로그에 `드래그 … → (x, y) …ms`가 찍힌다. 페이지 전체가 스크롤되거나 확대되지 않는다(무대에 `touch-action: none`).

---

### Task 13: SP-5b 타임라인 제스처와 저장 시간

> 🤖 · 👤 내 폰 확인 · 모델: Opus 5.5 high · 0.75일 · Jira: `S_SP5`

**실무 관점:** 이전 앱에서 타임라인 방식이 42분 동안 7번 바뀌었다. 그 원인은 선택지를 하나씩 만들어 보며 고른 데 있다. 여기서는 **세 방식을 한 페이지에 나란히** 두고 같은 동작을 시켜 비교한다. 그리고 상한 문서의 기기 저장소 쓰기 시간(A1)을 저가폰에서 재서, 선기록 설계(§7.2)가 느린 폰에서 버벅이지 않는지 본다.

**Files (브랜치 `spike/m0-lab`):**
- Create: `web/src/maxdoc.ts`, `web/src/maxdoc.test.ts`, `web/src/sp5-timeline.tsx`
- Modify: `web/src/main.tsx` (import 1줄, `pages` 1줄)

**Interfaces:**
- Produces: `makeMaxDoc()` — §5.3 상한을 꽉 채운 최악 문서(댄서 50 × 대형 200, 좌표 7자, 이름 20자 한글, teamFile 이름 200자). PUT 본문 677,155바이트로 실측했다(트리아지 추정 약 665KB와 일치). M1 통합 테스트 픽스처의 참고가 된다.

- [ ] **Step 1: 최악 문서 테스트를 먼저 쓴다**

`web/src/maxdoc.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { makeMaxDoc } from './maxdoc'

describe('makeMaxDoc (§5.3 상한, 트리아지 T-03)', () => {
  const doc = makeMaxDoc()
  it('상한을 꽉 채우고 규칙 안에 있다', () => {
    expect(doc.dancers).toHaveLength(50)
    expect(doc.formations).toHaveLength(200)
    expect(doc.dancers.every((d) => d.name.length === 20)).toBe(true)
    expect(doc.teamFile.name.length).toBe(200)
    doc.formations.forEach((f, n) => {
      if (n > 0) expect(f.startMs).toBeGreaterThan(doc.formations[n - 1].startMs)
      expect(f.startMs).toBeLessThanOrEqual(1_800_000)
      for (const p of Object.values(f.positions)) {
        expect(String(p.x)).toHaveLength(7)
        expect(p.x).toBeGreaterThanOrEqual(-0.1)
      }
    })
  })
  it('PUT 본문은 약 0.67MB로 1MB(10^6바이트) 안이다', () => {
    const bytes = new TextEncoder().encode(JSON.stringify({ baseRevision: 1, content: doc })).length
    expect(bytes).toBeGreaterThan(600_000)
    expect(bytes).toBeLessThan(1_000_000)
  })
})
```

Run: `cd /c/project/KICKOFF/web && npx vitest run src/maxdoc.test.ts`
Expected: FAIL — `Failed to resolve import "./maxdoc"`

- [ ] **Step 2: 최악 문서를 구현한다**

`web/src/maxdoc.ts`:

```ts
// §5.3 상한을 꽉 채운 최악 문서(트리아지 T-03): 댄서 50명 × 대형 200개, 좌표 7자, 이름 20자 한글, teamFile 이름 200자 한글.
const HANGUL = '가나다라마바사아자차카타파하'
// 1~79, 끝자리가 0이 아니다 → 좌표가 늘 "-0.01dd" 7자다.
const digits = (a: number) => 1 + (a % 9) + 10 * (Math.floor(a / 9) % 8)

export function makeMaxDoc() {
  const dancers = Array.from({ length: 50 }, (_, i) => ({
    id: crypto.randomUUID(),
    name: HANGUL.repeat(2).slice(0, 18) + String(i).padStart(2, '0'),
    color: '#E4572E',
  }))
  const formations = Array.from({ length: 200 }, (_, f) => ({
    id: crypto.randomUUID(),
    startMs: f * 9000,
    transitionInMs: f === 0 ? 0 : 2000,
    positions: Object.fromEntries(
      dancers.map((d, i) => [d.id, { x: -(100 + digits(i + f)) / 10000, y: -(100 + digits(i * 3 + f)) / 10000 }]),
    ),
  }))
  return {
    v: 1,
    grid: { cols: 24, rows: 16, backstageCols: 1 },
    tempo: { bpm: 118.5, firstBeatMs: 8500 },
    teamFile: { name: HANGUL.repeat(15).slice(0, 196) + '.mp4', durationMs: 1_800_000 },
    dancers,
    formations,
  }
}
```

Run: `cd /c/project/KICKOFF/web && npx vitest run src/maxdoc.test.ts`
Expected: `2 passed`

- [ ] **Step 3: 타임라인 페이지**

`web/src/sp5-timeline.tsx`:

```tsx
// SP-5b: 타임라인에서 "탐색(좌우로 밀기)"과 "블록 드래그"를 어떻게 가를지 세 방식을 비교한다(스펙 §4.3).
// 그리고 상한 문서의 A1 기기 저장소 쓰기 시간을 잰다(트리아지 T-11).
import { Fragment, useRef, useState } from 'react'
import type { PointerEvent as RPointerEvent } from 'react'
import { log } from './log'
import { makeMaxDoc } from './maxdoc'

type F = { start: number; tr: number }
type Scheme = 'longpress' | 'select' | 'grip'
type Gesture = { kind: 'pending' | 'scrub' | 'block'; block: number | null; x0: number; y0: number; t0: number; start0: number; timer: number; moved: boolean }

const SCHEMES: [Scheme, string][] = [
  ['longpress', 'A. 길게 누르면 블록, 그냥 밀면 탐색'],
  ['select', 'B. 탭해서 고른 블록만 드래그'],
  ['grip', 'C. 블록 아래 손잡이만 드래그'],
]
const INIT: F[] = Array.from({ length: 12 }, (_, i) => ({ start: i * 4000, tr: i === 0 ? 0 : 1000 }))
const PX_PER_MS = 0.06

/** §7.3 블록 드래그: 100ms 스냅(템포 없음) 뒤 겹침·순서 경계에서 클램프. 첫 대형은 움직이지 않는다. */
function moveBlock(fs: F[], i: number, raw: number): F[] {
  if (i === 0) return fs
  const prev = fs[i - 1]
  const cur = fs[i]
  const next = fs[i + 1]
  const lo = prev.start + Math.max(cur.tr, 1)
  const hi = next ? Math.min(next.start - next.tr, next.start - 1) : 1_800_000
  const start = Math.min(Math.max(Math.round(raw / 100) * 100, lo), hi)
  return fs.map((f, k) => (k === i ? { ...f, start } : f))
}

const fmt = (ms: number) => `${Math.floor(ms / 60000)}:${String(Math.floor((ms % 60000) / 1000)).padStart(2, '0')}.${Math.floor((ms % 1000) / 100)}`

export default function Sp5Timeline() {
  const [scheme, setScheme] = useState<Scheme>('longpress')
  const [fs, setFs] = useState<F[]>(INIT)
  const [t, setT] = useState(0)
  const [selected, setSelected] = useState<number | null>(null)
  const [dragging, setDragging] = useState<number | null>(null)
  const g = useRef<Gesture | null>(null)
  const latest = useRef({ fs, t })
  latest.current = { fs, t }
  const wrong = useRef(0)
  const end = fs[fs.length - 1].start + 4000

  const down = (e: RPointerEvent<HTMLDivElement>) => {
    const el = e.target as HTMLElement
    const attr = el.closest('[data-block]')?.getAttribute('data-block')
    const block = attr == null ? null : Number(attr)
    const onGrip = el.closest('[data-grip]') !== null
    e.currentTarget.setPointerCapture(e.pointerId)
    const gs: Gesture = { kind: 'pending', block, x0: e.clientX, y0: e.clientY, t0: t, start0: block == null ? 0 : fs[block].start, timer: 0, moved: false }
    if (block == null || block === 0) gs.kind = 'scrub'
    else if (scheme === 'grip') gs.kind = onGrip ? 'block' : 'scrub'
    else if (scheme === 'select') gs.kind = selected === block ? 'block' : 'pending'
    else
      gs.timer = window.setTimeout(() => {
        if (g.current === gs && !gs.moved) {
          gs.kind = 'block'
          setDragging(block)
          log(`길게 누름 → 대형 ${block + 1} 잡음`)
        }
      }, 300)
    g.current = gs
    if (gs.kind === 'block') setDragging(block)
  }

  const move = (e: RPointerEvent<HTMLDivElement>) => {
    const gs = g.current
    if (!gs) return
    const dx = e.clientX - gs.x0
    if (Math.abs(dx) > 8 || Math.abs(e.clientY - gs.y0) > 8) gs.moved = true
    if (gs.kind === 'pending' && gs.moved) {
      gs.kind = 'scrub'
      clearTimeout(gs.timer)
    }
    if (gs.kind === 'scrub') setT(Math.min(Math.max(gs.t0 - dx / PX_PER_MS, 0), end))
    if (gs.kind === 'block' && gs.block != null) {
      const b = gs.block
      setFs((prev) => moveBlock(prev, b, gs.start0 + dx / PX_PER_MS))
    }
  }

  const up = () => {
    const gs = g.current
    g.current = null
    if (!gs) return
    clearTimeout(gs.timer)
    const { fs: nowFs, t: nowT } = latest.current
    if (gs.kind === 'pending' && !gs.moved && gs.block != null) {
      if (scheme === 'select') {
        setSelected(gs.block)
        log(`[${scheme}] 대형 ${gs.block + 1} 선택`)
      } else log(`[${scheme}] 탭(동작 없음)`)
    } else if (gs.kind === 'scrub') log(`[${scheme}] 탐색 → ${fmt(nowT)}`)
    else if (gs.kind === 'block' && gs.block != null) log(`[${scheme}] 대형 ${gs.block + 1}: ${gs.start0} → ${nowFs[gs.block].start}ms`)
    setDragging(null)
  }

  const measureStorage = () => {
    const doc = makeMaxDoc()
    for (const [label, lastSent] of [['lastSent 없음', null], ['lastSent = 같은 문서', doc]] as const) {
      const times: number[] = []
      let chars = 0
      try {
        for (let k = 0; k < 5; k++) {
          const t0 = performance.now()
          const s = JSON.stringify({ baseRevision: 1234, content: doc, lastSent })
          localStorage.setItem('kickoff:pending:spike:max', s)
          times.push(performance.now() - t0)
          chars = s.length
        }
        times.sort((a, b) => a - b)
        log(`A1 쓰기(${label}): ${(chars / 1000).toFixed(0)}k자, stringify+setItem 중앙값 ${times[2].toFixed(1)}ms 최대 ${times[4].toFixed(1)}ms`)
      } catch (e) {
        log(`A1 쓰기(${label}) 실패: ${String(e)}`)
      } finally {
        localStorage.removeItem('kickoff:pending:spike:max')
      }
    }
  }

  return (
    <div>
      <p>
        {SCHEMES.map(([s, label]) => (
          <label key={s} style={{ display: 'block' }}>
            <input
              type="radio"
              checked={scheme === s}
              onChange={() => {
                setScheme(s)
                setSelected(null)
                wrong.current = 0
                log(`방식 → ${label}`)
              }}
            />
            {label}
          </label>
        ))}
      </p>
      <p style={{ fontSize: 24 }}>플레이헤드 {fmt(t)}</p>
      <div
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={up}
        onPointerCancel={up}
        style={{ position: 'relative', height: 96, overflow: 'hidden', background: '#222', touchAction: 'none', userSelect: 'none', WebkitUserSelect: 'none' }}
      >
        <div style={{ position: 'absolute', left: '50%', top: 0, bottom: 0, width: 2, background: 'red', zIndex: 10, pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: 8, bottom: 8, left: `calc(50% - ${t * PX_PER_MS}px)` }}>
          {fs.map((f, i) => {
            const until = fs[i + 1] ? fs[i + 1].start - fs[i + 1].tr : end
            return (
              <Fragment key={i}>
                {f.tr > 0 && (
                  <div style={{ position: 'absolute', left: (f.start - f.tr) * PX_PER_MS, width: f.tr * PX_PER_MS, top: 24, bottom: 24, background: '#557' }} />
                )}
                <div
                  data-block={i}
                  style={{
                    position: 'absolute',
                    left: f.start * PX_PER_MS,
                    width: Math.max(8, (until - f.start) * PX_PER_MS - 2),
                    top: 0,
                    bottom: 0,
                    background: i === dragging ? '#f90' : i === selected ? '#fc6' : '#48c',
                    color: '#fff',
                    borderRadius: 6,
                    fontSize: 12,
                    padding: 4,
                    boxSizing: 'border-box',
                  }}
                >
                  대형 {i + 1}
                  {scheme === 'grip' && i > 0 && (
                    <div data-grip style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: '45%', background: 'rgba(0,0,0,.3)', textAlign: 'center' }}>
                      ⇔
                    </div>
                  )}
                </div>
              </Fragment>
            )
          })}
        </div>
      </div>
      <p>
        <button
          onClick={() => {
            wrong.current++
            log(`[${scheme}] 의도와 다르게 움직임 ${wrong.current}회`)
          }}
        >
          의도와 다르게 움직임 +1
        </button>{' '}
        <button
          onClick={() => {
            setFs(INIT)
            setT(0)
            log('타임라인 초기화')
          }}
        >
          초기화
        </button>
      </p>
      <h2>저장 시간 (저가 안드로이드에서)</h2>
      <button onClick={measureStorage}>상한 문서 A1 쓰기 시간 재기</button>
    </div>
  )
}
```

`web/src/main.tsx`: `import Sp5Timeline from './sp5-timeline'`, `pages`에 `'5b': ['SP-5b 타임라인 제스처·저장 시간', Sp5Timeline],`.

- [ ] **Step 4: 전체 테스트·빌드·푸시·내 폰 확인**

```bash
source ~/.kickoff-env && cd /c/project/KICKOFF/web && npm test && npm run build && cd .. && git add web/src && git commit -m "$S_SP5 chore(spike): SP-5b 타임라인 제스처와 저장 시간

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>" && git push
```

Expected: `Test Files 3 passed`, `Tests 15 passed`, 빌드 성공.
👤 내 폰에서 `…/?sp=5b`: 방식 A~C마다 빈 곳을 밀어 탐색하고 대형 3을 옮겨 본다. [상한 문서 A1 쓰기 시간 재기]를 눌러 로그에 두 줄(`lastSent 없음`, `lastSent = 같은 문서`)이 찍히는지 본다.

---

### Task 14: 👤 기기 세션 (SP-1~SP-5 실측) + SP-6

> 👤 사용자(동아리원 도움) · 🤖 결과 정리 보조 · 반나절~1일 · Jira: `S_RESULT`

**실무 관점:** 빌린 기기는 다시 빌리기 어렵다. 그래서 순서표와 기록 방법을 미리 정하고, 한 번에 끝낸다. 판정 규칙(T15 표)을 **세션 전에 읽는다.** 결과를 보고 규칙을 바꾸고 싶어지면, 그 자체를 결과 PR에 적고 사용자가 판단한다.

**Files:** 레포에 커밋하지 않는다. 원자료는 PC의 `spike-assets/logs/`(gitignore)에 모은다.

**환경:** E1 iOS Safari · E2 iOS 카톡 인앱 · E3 Android Chrome · E4 Android 카톡 인앱 · E5 삼성 인터넷. **iOS 26 이하 기기 1대는 필수다**(스펙 §11 SP-3). E1이 iOS 26 이하면 그것으로 충족하고, 아니면 iOS 26 이하 기기를 E1′로 더해 적어도 SP-1(홈·재생 부분)과 SP-3을 잰다.

- [ ] **Step 1: 준비물 점검**

T0-6의 기기, 충전기, 녹화 폰(60fps), 유선 이어폰, 블루투스 이어폰, PC. 각 기기에 T8 Step 6의 파일 ①~④. 기기 주인에게 "이 기기에 테스트 파일을 넣고, 화면을 녹화하고, 카카오 로그인 시험을 한다. 끝나면 파일·녹화·사이트 데이터·로그인 연결을 모두 지운다"는 동의를 받는다. 녹화 폰은 가능하면 본인 폰을 쓰고, 빌린 폰으로 녹화했다면 파일은 **USB로만** 옮긴다(주인의 클라우드에 올리지 않는다).

- [ ] **Step 2: 환경마다 공통 (E1~E5 각각, 약 40분)**

1. 주소 열기: E2·E4는 카톡 채팅방에 보낸 링크를 눌러서, 나머지는 브라우저 주소창에 `https://spike-m0-lab.$PAGES.pages.dev/`.
2. **홈:** 환경 점검 표 → [로그 복사]로 PC에 보낸다(`spike-assets/logs/E1-env.txt` 식으로 저장).
3. **SP-1** (`?sp=1`, 자동 잠금 30초로 맞춘 뒤):
   - 원본 mp4(③)를 "보이기"로 10초 재생 → [소리 들림]/[소리 안 들림].
   - display:none, visibility:hidden, 1px 투명으로 각각 다시 [재생] 10초 → 소리와 "재생 위치"가 오르는지 관찰 버튼으로 남긴다.
   - "보이기"에서 0.5배·0.75배, 음정 유지 켬/끔 → 음정이 변하면 [음정이 변함].
   - **화면 꺼짐:** mp4를 "보이기"로 재생하고 손대지 않고 70초 → 화면이 꺼졌으면 켜고 [화면이 꺼졌음]. **m4a(④)로 한 번 더.**
   - **길이:** ①②③④를 차례로 불러 "불러온 파일의 길이" 표를 채운다.
   - [로그 복사] → `E1-sp1.txt`.
4. **SP-2** (E2·E4만, `?sp=2`): A·B·C를 차례로 누르고 결과 버튼, 수동 경로도 해 보고 실제 메뉴 이름을 로그에 적어 둔다(메모 입력은 결과 버튼 뒤 카톡으로 따로 보내도 된다). [로그 복사] → `E2-sp2.txt`.
5. **SP-4** (`?sp=4`, 동의받은 경우만): [카카오로 로그인] → 선택 항목 모두 끄고 동의 → `?sp=4`로 돌아와 `SP-4 결과`가 찍히는지. E2·E4는 **카톡 인앱 안에서 돌아오는지**가 핵심이다. [로그 복사] → `E2-sp4.txt`. 끝나면 [로그아웃], 기기 주인에게 연결 끊기(T11 Step 7 경로)를 부탁하고, Supabase Users에서 그 사용자를 지운다.
6. **SP-3**은 Step 3에서 따로 한다.

- [ ] **Step 3: SP-3 녹화 (환경마다 3분 + 탐색 20초)**

T10 Step 9 "측정 절차"대로 E1~E5를 녹화한다. E1이 iOS 26 이하가 아니면 E1′도 녹화한다. 내장 스피커 기준이다. 한 환경은 **블루투스 이어폰**으로도 한 번 더 녹화한다(참고값, 녹화 폰 마이크를 이어폰 가까이). 파일 이름 `rec-E1.mp4` … `rec-E3-bt.mp4`. 녹화가 끝나면 그 환경의 SP-3 로그도 [로그 복사] → `E1-sp3.txt`(재앵커 통계).

- [ ] **Step 4: SP-5 (리더가 실제로 쓸 폰 1대 + 화면이 가장 작은 폰 1대)**

`?sp=5a`:
- 16×8·20명, 배율 1.0, 라벨 "이름 앞 2글자": 토큰 20개를 백스테이지에서 무대 여기저기로 옮긴다. 다른 토큰이 잡히면 [다른 토큰이 잡힘 +1], 안 잡히면 [안 잡힘 +1]. 마지막에 [편집 가능]/[편집 불가].
- 같은 것을 6×4·50명으로. 배율을 하나 바꿔(예 1.2) 한 번 더.
- [+댄서]로 겹친 토큰(같은 자리 두 명)을 끌어낸다 → 끌어내기 실패가 있었는지. [겹침 비켜 놓기]를 켜고 다시.
- 라벨: [기본 이름("댄서 N")]을 켜 보고, "이름 앞 2글자"와 "번호"를 비교해 어느 쪽이 구분되는지 로그 버튼(판정) 옆에 한 줄 메모.

`?sp=5b`:
- 방식 A·B·C마다: 탐색(빈 곳 밀기) 10회 + 대형 3·5·7 옮기기 5회. 의도와 다르면 [의도와 다르게 움직임 +1].
- **빌린 기기 중 가장 오래된 안드로이드**에서 [상한 문서 A1 쓰기 시간 재기].

[로그 복사] → `P1-sp5.txt`, `P2-sp5.txt`.

- [ ] **Step 5: SP-3 분석 (PC)**

녹화마다 T10 Step 9 "분석" 명령을 돌려 결과를 `spike-assets/logs/sp3-<환경>.txt`로 저장한다:

```bash
cd /c/project/KICKOFF/spike-assets && mkdir -p logs
node ../spike-tools/analyze.mjs rec-E1-luma.txt rec-E1.wav <AV> <시작초> > logs/sp3-E1.txt
```

- [ ] **Step 6: SP-6 Lightsail 서울 가격 (책상 조사, 10분)**

https://aws.amazon.com/lightsail/pricing/ 에서 리전을 서울(ap-northeast-2)로 두고 Linux 2GB 번들의 월 요금, 포함 전송량, IPv4 포함 여부를 확인해 적는다. 스펙에 가격 숫자는 없으므로 결과표에만 적는다(M1 비용 판단용).

- [ ] **Step 7: 개인정보 정리 (Review Focus 3)**

```bash
ls /c/project/KICKOFF/spike-assets/logs
git -C /c/project/KICKOFF status --short --ignored | grep spike-assets
```

Expected: 로그는 `spike-assets/logs/`에만 있고 `!! spike-assets/`(무시됨)로 나온다. Supabase Users에 시험 사용자가 남지 않았는지 대시보드에서 확인한다. 결과표에는 **값이 아니라 판정**(되는지·안 되는지, 키 이름, alg)만 옮긴다.

빌린 기기마다 돌려주기 전에 정리한다(주인과 함께 확인): 테스트 파일 ①~④와 녹화 삭제, 스파이크 사이트 데이터 삭제(브라우저 설정에서 `spike-m0-lab.<PAGES>.pages.dev` 사이트 데이터 지우기, 카톡 인앱은 [로그아웃] 뒤 창 닫기), 카카오 연결 끊기 확인.

---

### Task 15: 결과표와 스펙 갱신 PR (M0 끝나는 조건)

> 🤖 결과 정리·스펙 편집 · 👤 판정 확인 · 모델: Opus 5.5 high, 리뷰는 **Fable 5.1 high 1회**(스펙 확정 슬롯) · 1일 · Jira: `S_RESULT`

**실무 관점:** 스파이크의 산출물은 코드가 아니라 **결정**이다. 측정값 → (미리 정한) 규칙 → 스펙 변경이 한 PR 안에서 추적되게 만든다. 나중에 "왜 핀치 줌이 Must지?"라고 물으면 이 PR 하나가 답이다.

**Files:**
- Create: `docs/spikes/m0-results.md`
- Modify: `docs/superpowers/specs/2026-09-26-kickoff-v1-design.md` (아래 판정 표가 가리키는 절만)
- Modify: `docs/ops/external-services.md` (SP-4에서 카카오 앱이 바뀌었으면)

**Interfaces:**
- Consumes: T7~T14의 로그와 분석 결과, 판정 표(아래, 측정 전에 정함)
- Produces: M1 계획의 입력(스펙 최신판 + 결과표 + 트리아지 §4)

**판정 표 (측정 전에 정한다 — 바꾸려면 PR 본문에 이유를 적고 사용자가 정한다)**

| 스파이크 | 측정 | 규칙 | 스펙 반영 |
|---|---|---|---|
| 환경 점검 | Web Locks, Wake Lock, preservesPitch, 저장소 | 어느 환경이든 `Web Locks=false`면 §7.2 편집권 설계를 **이슈로 올려 트리아지**한다(이 PR에서 고치지 않는다) | — / 이슈 |
| SP-1 숨김 재생 | 표시 방식별 소리·재생 위치 | 5개 환경 모두 display:none에서 재생되면 §4.3 "재생 요소는 숨긴다". 아니면 모든 환경에서 되는 가장 작은 방식을 쓴다. 어떤 숨김도 안 되는 환경이 있으면 "보이는 작은 영상 영역" | §4.3 재생 요소 |
| SP-1 화면 꺼짐 | mp4·m4a 70초 | 꺼진 환경이 카톡 인앱뿐이면 M-15 배너에 "화면이 꺼지면 외부 브라우저로 열어 주세요"를 더한다. Safari·Chrome·삼성에서도 꺼지면 이슈로 올려 트리아지(NoSleep 방식 대체 등) | M-14, M-15 |
| SP-1 m4a | 고르기·재생·길이 | 한 환경이라도 m4a를 못 고르거나 못 틀면 §1.4 "mp4 권장" → "mp4로 정한다"(⑥ 문구 포함) | §1.4, §4.1 ⑥ |
| SP-1 배속 | 0.5·0.75배 음정 | 4개 환경 이상에서 음정이 유지되면 S-14 비고에 "가능"을, 아니면 안 되는 환경을 적는다 | §2.2 S-14 |
| SP-1 길이 차 | ①~④의 duration | `FILE_MATCH_TOLERANCE_MS = max(500, 100 단위로 올림(최대 차이 + 100))`. 최대 차이가 2000ms 이상이면 사용자가 정한다(검사가 약해진다) | §7.4 |
| SP-2 | 방법별 결과 | OS별로 된 방법을 M-15 안내에 쓴다. 자동 탈출이 되는 OS는 버튼 + 수동 안내, 안 되는 OS는 수동 안내만(실제 메뉴 이름) | M-15, §7.5 2번 |
| SP-3 | 환경별 평균·표준편차·최대, 탐색 뒤 최대, 재앵커 점프 | 모든 환경(내장 스피커) 최대 \|어긋남\| ≤ 50 → §7.4 드리프트 처리 = "재앵커만(현행)"으로 확정하고 측정 최대 점프를 적는다. 50을 넘는 환경이 있고 표준편차 ≤ 15ms(일정한 어긋남) → **S-17 싱크 보정을 Must로 올린다**. 표준편차 > 15ms → 보정으로 못 고치므로 엔진 개선 이슈(Must 승격 아님). 블루투스는 참고값만 적는다 | §7.4, §2 S-17 |
| SP-4 | scope, KOE205, 동의 거부 가입, 인앱 복귀, alg | 비즈 전환이 필요했으면 §12의 해당 항목을 "완료(날짜)"로, §7.1 2번의 조건문을 사실로 고친다. 인앱 복귀가 실패한 OS가 있으면: 실패 로그가 PKCE code verifier 오류(예: `code verifier`·`flow state` 관련)면 흐름 선택(pkce/implicit)을 M1 이슈로 올리고 L0 문구는 보류한다. 그 밖의 실패면 L0에 "카톡 안에서는 로그인이 안 될 수 있어요. 외부 브라우저로 열어 주세요"(M-15 안내 재사용). alg를 §9.1에 확정(ES256이면 현행 문장 그대로). Supabase Auth에 저장되는 항목을 §9.4에 확정(M-17 입력) | M-01, §7.1, §9.1, §9.4, §12 |
| SP-5 핀치 줌 | 16×8·20명 오터치·판정 | 20회 중 오터치+헛터치 3회 이상이거나 판정 "편집 불가" → **S-11을 Must로 올린다** | §2 S-11 |
| SP-5 토큰 | 배율·라벨별 오터치, 라벨 메모 | 오터치가 가장 적은 배율과 라벨 방식을 §4.3 초기값으로 적는다 | §4.3 |
| SP-5 겹침 | 겹친 토큰 끌어내기 | 한 번이라도 실패했으면 트리아지 §2 비켜 놓기 규칙을 §7.3 댄서 추가에 넣는다 | §7.3 |
| SP-5 제스처 | 방식별 "의도와 다름" | 가장 적은 방식을 §4.3에 적는다. 같으면 C(손잡이, 구현이 가장 단순) | §4.3 |
| SP-5 저장 | A1 쓰기 중앙값 | 100ms를 넘으면 이슈로 올린다(스펙 변경 아님) | — / 이슈 |
| SP-6 | 서울 2GB 월 요금 | 결과표에만 적는다 | — |

- [ ] **Step 1: 결과 PR 이슈와 브랜치**

```bash
source ~/.kickoff-env && cd /c/project/KICKOFF && git switch develop && git pull --ff-only
N=$(gh issue create --repo "$ORG/$REPO" --label model:fable-high --title "[$S_RESULT] M0 스파이크 결과와 스펙 갱신" --body "계획 T15. 판정 표는 계획에 측정 전에 정해 두었다." | grep -o '[0-9]*$')
git switch -c "docs/$N-spike-results" && git branch --show-current
gh issue list --repo "$ORG/$REPO" --label spike --state open --json number,title --jq '.[] | "#\(.number) \(.title)"'
```

Expected: 스파이크 이슈 6개(T7~T12). PR 본문의 `Closes` 줄은 Step 5가 이 목록에서 이슈마다 한 줄씩 만든다(키워드 하나는 이슈 하나만 닫는다).

- [ ] **Step 2: 결과표를 쓴다**

`docs/spikes/m0-results.md`를 이 틀로 만들고 T14 로그에서 값을 옮긴다. 빈 칸 없이 채우고, 못 잰 칸은 "못 잼(이유)"로 쓴다.

```markdown
# M0 스파이크 결과

- 기기 세션: <날짜>
- 기기(모델과 OS·앱 버전만 적는다. 기기 주인을 알 수 있는 표기는 쓰지 않는다): E1 <모델/iOS 버전>, E2 <같은 기기의 카톡 버전>, E3 <모델/Android/Chrome 버전>, E4 <카톡 버전>, E5 <모델/삼성 인터넷 버전>
- iOS 26 이하 측정 기기: <E1 또는 E1′, 모델/iOS 버전>
- M2·M4 재대여 가능 기기: <있음/없음, 대략 시기>
- 원자료: 작성자 PC `spike-assets/logs/`(공개하지 않음)
- 판정 규칙: M0 계획 T15 표(측정 전에 정함)

## 환경 점검
| 항목 | E1 | E2 | E3 | E4 | E5 |
|---|---|---|---|---|---|
| Web Locks / locks.request | | | | | |
| Wake Lock | | | | | |
| preservesPitch / webkitPreservesPitch | | | | | |
| 저장소 할당량 | | | | | |
| 미리보기 `_headers` 적용(T7) | 예/아니오(환경 무관) | — | — | — | — |

## SP-1 파일·재생·화면 유지
| 항목 | E1 | E2 | E3 | E4 | E5 |
|---|---|---|---|---|---|
| mp4 고르기·재생(보이기) | | | | | |
| display:none 재생 | | | | | |
| visibility:hidden 재생 | | | | | |
| 1px 투명 재생 | | | | | |
| 0.5배 / 0.75배 음정 유지 | | | | | |
| Wake Lock 획득 | | | | | |
| mp4 70초 화면 유지 | | | | | |
| m4a 고르기·재생 | | | | | |
| m4a 70초 화면 유지 | | | | | |

| 파일 | 길이(ms) | 원본과 차이(ms) |
|---|---|---|
| ③ 원본(파일 전송) | | 0 |
| ① 카톡 동영상 일반 | | |
| ② 카톡 동영상 고화질 | | |
| ④ m4a | | |

## SP-2 외부 브라우저로 열기
| 방법 | iOS 카톡 | Android 카톡 |
|---|---|---|
| A. kakaotalk://web/openExternal | | |
| B. intent (Chrome 지정) | 해당 없음 | |
| C. intent (기본 브라우저) | 해당 없음 | |
| 수동 경로(실제 메뉴 이름) | | |

## SP-3 싱크 (±50ms = 스펙 §8 정의)
| 환경 | 짝 수 | 평균 | 표준편차 | 최대 \|어긋남\| | 탐색 뒤 최대 | 재앵커 점프 최대 | ≤50ms 비율 |
|---|---|---|---|---|---|---|---|
| E1 | | | | | | | |
| E2 | | | | | | | |
| E3 | | | | | | | |
| E4 | | | | | | | |
| E5 | | | | | | | |
| iOS 26 이하(E1 또는 E1′) | | | | | | | |
| 블루투스(참고) | | | | | | | |

## SP-4 카카오 로그인
| 항목 | 결과 |
|---|---|
| 요청 scope | |
| 비즈 앱 전환 없이 로그인 | |
| 비즈 앱 전환(했다면 날짜) | |
| 선택 동의 모두 거부 시 가입 | |
| iOS 카톡 인앱에서 복귀 | |
| Android 카톡 인앱에서 복귀 | |
| JWT alg / iss / aud | |
| 인증 흐름 | PKCE(스파이크 설정) |
| Supabase Auth에 저장되는 항목(처리방침용) | |

## SP-5 손맛
| 기기 | 프리셋 | 배율 | 라벨 | 드래그 | 오터치 | 헛터치 | 판정 |
|---|---|---|---|---|---|---|---|

| 방식 | 의도와 다름 / 시도 |
|---|---|
| A 길게 누르기 | |
| B 선택 후 드래그 | |
| C 손잡이 | |

- 겹친 토큰 끌어내기: 비켜 놓기 끔 <결과> / 켬 <결과>
- A1 쓰기(가장 오래된 안드로이드 <모델>): lastSent 없음 <ms>, lastSent = 같은 문서 <ms>

## SP-6 Lightsail 서울
| 번들 | 월 요금 | 전송량 | IPv4 |
|---|---|---|---|

## 판정 (규칙 적용 결과)
| 규칙 | 결과 | 스펙 반영 |
|---|---|---|
```

- [ ] **Step 3: 판정 표를 적용해 스펙을 고친다**

판정 표의 "스펙 반영" 칸이 가리키는 절만 고친다. 고친 곳마다 결과표 "판정" 표에 한 줄씩 남긴다. 그리고 다음을 함께 고친다:
- §11 표 아래에 `- **M0 결과:** docs/spikes/m0-results.md (<날짜>).`
- §12: 서비스 이름 "정함: <$NAME>(T0 날짜)", 파일럿 시점(T0 Step 7 답, 아직이면 "미정"), 학교급(T0 Step 7 답. 중학교면 "만 14세 미만 항목 재트리아지 이슈 #…"), 카카오 비즈 앱 전환(SP-4 결과).
- `docs/ops/external-services.md`: SP-4에서 카카오 앱이 바뀌었으면 고친다. 그리고 **M1 전까지 스테이징의 카카오 공급자를 끈다**(Supabase → Sign In / Providers → Kakao → Disable). 공개 레포에서 미리보기 주소를 알아낸 제3자가 스테이징에 가입하는 것을 막는다. 표에 "M0 뒤 꺼 둠, M1에서 켠다"를 적는다.
- 트리아지 §2 후보(비켜 놓기)는 판정 표의 SP-5 겹침 규칙대로 넣거나 넣지 않는다.
- 변경 이력에 `- M0 스파이크 결과 반영(docs/spikes/m0-results.md): <바뀐 것 요약>.`

`Must`를 올리는 결정(S-11, S-17)이 있으면 스펙 §0의 "Must = 빠지면 완료 시나리오가 깨지는 것" 기준으로 PR 본문에 근거 한 줄을 쓴다.

- [ ] **Step 4: 남은 빈칸 확인**

```bash
grep -nE '(^|[^\\])\| +\|' docs/spikes/m0-results.md | head
```

Expected: 출력 없음(빈 칸 없음). 못 잰 칸은 "못 잼(이유)"로 채운다. (패턴은 `\|어긋남\|`처럼 이스케이프한 막대는 빈 칸으로 세지 않는다.)

- [ ] **Step 5: 커밋·PR·리뷰·머지**

```bash
source ~/.kickoff-env && cd /c/project/KICKOFF
B=$(git branch --show-current); N=$(echo "$B" | sed -E 's#^[a-z]+/([0-9]+)-.*#\1#'); echo "$B #$N"
CLOSES=$(gh issue list --repo "$ORG/$REPO" --label spike --state open --json number --jq '.[] | "Closes #\(.number)"'); echo "$CLOSES"
git add docs/spikes/m0-results.md docs/superpowers/specs/2026-09-26-kickoff-v1-design.md docs/ops/external-services.md
git commit -m "$S_RESULT docs(spec): M0 스파이크 결과 반영

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
git push -u origin HEAD
gh pr create --repo "$ORG/$REPO" --base develop --title "$S_RESULT docs(spec): M0 스파이크 결과 반영" --body "Closes #$N
$CLOSES

## 무엇을 / 왜
스파이크 결과표를 남기고, 측정 전에 정한 판정 규칙(M0 계획 T15)대로 스펙을 고친다. M0 끝나는 조건(스펙 §10).

## 판정 요약
(결과표 '판정' 표를 옮긴다)

🤖 Generated with [Claude Code](https://claude.com/claude-code)"
```

AI 봇 리뷰 + Fable 5.1 high 로컬 리뷰 1회(`/model`로 Fable → `/code-review <PR> --comment` → 모델 되돌리기). 스레드를 규칙대로 처리한 뒤 머지한다(머지 가능 상태가 `CLEAN`일 때만):

```bash
source ~/.kickoff-env && cd /c/project/KICKOFF && B=$(git branch --show-current)
test "$(gh pr view "$B" --repo "$ORG/$REPO" --json mergeStateStatus --jq .mergeStateStatus)" = CLEAN && \
gh pr merge "$B" --repo "$ORG/$REPO" --squash --delete-branch && git switch develop && git pull --ff-only
```

확인: `source ~/.kickoff-env && gh issue list --repo "$ORG/$REPO" --label spike --state open` → 출력 없음(스파이크 이슈가 모두 닫혔다).

---

### Task 16: 스프린트 끝 릴리스 절차 (스프린트 1·2 각각)

> 👤+🤖 · 모델: Opus 5.5 high · 0.25일 · Jira: 스프린트 종료

**실무 관점:** develop은 "다음 릴리스 후보", main은 "나간 것"이다. 스프린트마다 develop → main을 **merge commit**으로 합치는 이유는, squash하면 main과 develop의 기록이 갈라져 다음 릴리스부터 매번 충돌하기 때문이다(스펙 §3.3). 릴리스 PR이 머지되면 Jira 자동화가 그 스프린트의 스토리를 완료로 옮긴다. 사람 손으로 상태를 옮기지 않는 것이 목표다.

- [ ] **Step 1: 릴리스 PR**

```bash
source ~/.kickoff-env && cd /c/project/KICKOFF && git switch develop && git pull --ff-only && git fetch origin main
git log --oneline origin/main..origin/develop
gh pr create --repo "$ORG/$REPO" --base main --head develop --title "release: 스프린트 <번호> (<스토리 키들>)" --body "$(git log --format='- %s' origin/main..origin/develop)

🤖 Generated with [Claude Code](https://claude.com/claude-code)"
```

제목에 이번 스프린트의 스토리 키를 모두 적는다(예: `release: 스프린트 1 (KICK-2, KICK-3)`). Jira가 PR 제목의 키로도 작업을 연결하므로, 커밋 쪽 연결이 빠져도 자동화가 동작한다.

- [ ] **Step 2: 확인과 머지**

```bash
source ~/.kickoff-env && cd /c/project/KICKOFF
gh pr checks develop --repo "$ORG/$REPO" --watch
gh pr merge develop --repo "$ORG/$REPO" --merge
git ls-remote --heads origin develop main
```

Expected: `ci-ok pass`(head가 develop이므로 가드 통과). 머지는 **`--merge`만** 쓰고 `--delete-branch`를 붙이지 않는다(develop은 룰셋 `deletion` 규칙이 지우지 못하게 막지만, 명령에서도 요청하지 않는다). 마지막 명령에 `develop`과 `main`이 둘 다 보여야 한다.

- [ ] **Step 3 (👤): Jira 자동화 확인**

이번 스프린트 스토리가 Done으로 옮겨졌는지 본다. 안 옮겨졌으면 Automation → 규칙 → Audit log에서 원인을 본다. 조건이 걸렸으면 `{{pullRequest.destinationBranch.name}}`으로 바꾸고, 작업 연결이 없었으면 릴리스 PR 제목의 키를 확인한다. 고친 뒤 이번만 손으로 Done 처리한다.

- [ ] **Step 4 (👤): 스프린트 닫기와 벨로시티**

Jira에서 스프린트를 완료한다(남은 스토리는 다음 스프린트로). 이번 스프린트에 끝낸 태스크 수와 실제 쓴 날 수를 스프린트 보고서 댓글에 적는다. **스프린트 1이 끝나면** 이 숫자로 M0 남은 일과 Must 40~70일 어림을 다시 본다(스펙 §10).

- [ ] **Step 5: M0를 닫을 때만 (스프린트 2 릴리스 뒤)**

- Jira 에픽 "M0 준비·스파이크"를 완료로 옮긴다.
- 🤖 Claude 메모리와 인계 기록을 갱신한다: M0 완료, 결과표 경로, 다음 할 일 = `superpowers:writing-plans`로 **M1 계획**(입력: 최신 스펙, `docs/spikes/m0-results.md`, 트리아지 §4 M1 확인 항목).
- `spike/m0-lab` 브랜치는 M1 계획을 쓸 때 참고한 뒤 지운다(`git push origin --delete spike/m0-lab`). 그때 Supabase 스테이징 Authentication → Users가 비었는지, 카카오 공급자가 꺼져 있는지(T15) 한 번 더 본다.

---

## 이 계획이 다루지 않는 것 (M1 이후)

- 운영 Supabase 프로젝트, 도메인, Lightsail VM, Caddy, 배포 파이프라인, cron, 백업(M1).
- CI의 `changes`·`web`·`api` 잡(`dorny/paths-filter@v4`)과 GitHub Environment `deploy`(M1).
- 스펙 §3.3의 `web/`·`api/` 폴더별 `CLAUDE.md`와 backend·frontend의 worktree 격리(`isolation: worktree`, 필요하면 `worktree.baseRef: head`): 폴더가 생기고 병렬 작업을 시작하는 M1 이후에 켠다. M0에 켜면 서브에이전트가 develop 기준 worktree에서 일해 `spike/m0-lab`의 코드를 보지 못한다.
- 스펙 §13 ADR 8건 기록: M1의 첫 태스크(이슈 → `docs/adr/0001~0008` → PR).
- 트리아지 §4 **전체(6개 항목)**: sshd 비밀번호 로그인 꺼짐, unattended-upgrades와 재부팅·`restart: unless-stopped`, Lightsail 방화벽 IPv4·IPv6 443, 스테이징 1.1MB PUT → 413, 실제 토큰으로 인증 API 호출, 백업 버킷 서울 리전.
