# 외부 서비스 설정 기록

비밀값(비밀번호, Client Secret, 토큰)은 여기에 적지 않는다. **어디에 있는지만** 적는다. 설정을 바꾸면 이 표도 같은 PR에서 고친다.

| 서비스 | 이름·식별자 | 지역 | 켠 설정 | 비밀값 위치 | M1에서 바꿀 것 |
|---|---|---|---|---|---|
| GitHub | `formate-crew/formate`(공개) | — | 룰셋 develop·main(`docs/ops/github/`), push protection, 자동 링크 `FORM-`, 라벨 3개 | 저장소 시크릿 `CLAUDE_CODE_OAUTH_TOKEN` | Environment `deploy`(SSH 키, E2E 계정) |
| Jira | `formate-crew.atlassian.net`, 키 `FORM` | — | Scrum(team-managed), GitHub for Atlassian, 자동화 "릴리스 PR 머지 → 스토리 완료" | — | M1 에픽 |
| Cloudflare Pages | `formate-crew` | — | Git 연결, root `web`, Vite, 빌드 감시 `web/*`, 미리보기 `spike/*`만, 운영 자동 배포 끔 | Preview 변수 `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`(공개용) | 미리보기 전체 브랜치, 운영 자동 배포 켜기, 도메인, `_headers`, Workers 이전 검토(대시보드가 Pages를 "legacy"로 표시) |
| Supabase(스테이징) | `formate-staging`, `cqinpgdxpdgilfaaztnp` | 서울 | Auth Kakao, Allow users without an email ON, 리다이렉트 `https://*.formate-crew.pages.dev/**`·`http://localhost:5173/**` | DB 비밀번호: 사용자 비밀번호 관리자 | 운영 프로젝트, E2E용 이메일 로그인, 스키마 `app`·역할 |
| Kakao Developers | 앱 "FORMATE staging", 회사명 `FORMATE`, 대표 도메인 `https://formate-crew.pages.dev` | — | 카카오 로그인 ON, Redirect URI `https://cqinpgdxpdgilfaaztnp.supabase.co/auth/v1/callback`, 닉네임 필수·사진 선택(동의 목적: 로그인한 리더를 화면에 표시) | Client Secret: Supabase 대시보드에만 | 비즈 앱 전환 여부(SP-4 결과), 동의 목적 문구를 처리방침(M-17)과 맞추기 |
