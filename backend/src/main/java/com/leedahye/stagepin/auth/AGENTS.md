# 카카오 로그인·세션

- 시작 → 카카오 callback → 일회용 handoff code 교환 → StagePin 세션 흐름을 유지한다. 카카오 access token을 클라이언트 세션으로 사용하지 않는다.
- state·handoff code는 만료·일회성 소비를 검증하고, 교환 시 PKCE challenge/verifier 연결과 웹 Origin 검사를 유지한다.
- 세션 토큰은 서버 저장 시 해시 처리한다. 웹은 HttpOnly 쿠키, 네이티브는 Bearer + SecureStore 계약을 유지한다.
- 웹 로그인은 프론트의 same-origin 프록시와 cookie path/SameSite/Secure 설정을 함께 확인한다. 운영에서 localhost로 redirect하지 않는다.
- callback/return URI는 설정된 허용값만 사용한다. 사용자 입력을 그대로 redirect URL로 받지 않는다.
- 인증 응답의 no-store와 민감 URL의 referrer 보호를 유지한다. 코드·토큰·클라이언트 시크릿·프로필 원문은 로그로 남기지 않는다.
- 닉네임·이메일은 실제 동의/권한과 nullable 응답을 따른다. 닉네임을 실명으로 설명하거나 없는 이메일을 만들어 넣지 않는다.
- API 변경 시 `mobile/src/api/auth.ts`, callback 화면, `docs/kakao-login.md`를 함께 확인한다.
- `KakaoLoginClientTest`, `MemberAuthControllerTest`, `MemberAuthStoreDatabaseTest`에서 만료·재사용·잘못된 Origin·프로필 누락 회귀를 확인한다.
