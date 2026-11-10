# 카카오 로그인

## 현재 구현 범위

- MY의 공식 카카오 로그인 버튼, 프로필(닉네임·제공된 이메일) 표시, 로그인 완료 안내, 서비스 로그아웃. 2026-11-06 MY 정리로 재연동 버튼과 저장 위치 설명은 제거했다. [MY 구성](my-screen-ux.md) 참고.
- 카카오 REST API 인가 코드 교환과 사용자 조회는 백엔드에서만 실행한다.
- 카카오 사용자 ID로 회원을 식별한다. 동의 후 제공된 유효·인증된 이메일만 선택적으로 저장하며 이메일 일치로 계정을 합치지 않는다. 전화번호와 실명은 수집하지 않는다.
- 닉네임·프로필 사진이 제공되지 않아도 기본 이름으로 로그인할 수 있다.
- 회원과 소셜 계정 연결을 분리해 향후 Apple 로그인을 추가할 수 있게 했다. Apple 로그인 자체는 아직 없다.
- 공연·굿즈 탐색은 비로그인으로 유지한다. 굿즈 등록/내 글 조회는 세션 회원을 검증하고 글·사진을 DB에 저장한다. 로그인 아티스트·공연 찜은 회원별 DB 저장, 비로그인 찜과 내 일정은 기기 데이터다. [굿즈 저장](goods-persistence.md), [회원 찜](account-favorites.md) 참고. 회원 찜은 2026-11-06 로컬 구현이며 운영 반영은 별도다.

## 로컬 설정

기존 StagePin 카카오 개발자 앱에서 다음을 설정한다.

1. 카카오 로그인 활성화 ON.
2. 앱 → 플랫폼 키 → REST API 키 확인. 지도용 JavaScript 키와 다르다.
3. REST API 키에 Redirect URI `http://localhost:8080/api/v1/auth/kakao/callback` 등록.
4. 닉네임(`profile_nickname`)은 선택 동의로 설정한다. 이름 표시는 실명이 아닌 닉네임이다. 이메일(`account_email`)은 콘솔에서 권한을 받은 경우에만 선택 동의로 설정한다. 콘솔 확인 당시(2026-10-29)는 이메일·실명이 '권한 없음'이며 닉네임만 사용자 승인 후 '선택 동의'로 설정했다. 일반 로그인은 scope를 강제하지 않는다. 서버의 profileConsent 추가 동의 옵션은 남아 있지만 MY에 재연동 버튼을 제공하지 않는다. 프로필 사진은 필요 시 별도 동의가 필요하다.
5. 로그인 때 카카오가 제공한 동의/권한 범위 내에서 프로필을 갱신한다. 인증되지 않았거나 동의되지 않은 이메일은 저장하지 않는다. 회원 조회 때 이메일이 제공되지 않으면 기존 값도 제거한다. 이메일은 MY 본인 세션에만 노출하고 공개 API에는 추가하지 않는다.
6. `infra/.env`에 아래 변수를 입력한 후 API를 재생성한다. 실제 키는 Git·채팅·스크린샷에 넣지 않는다.

```dotenv
KAKAO_REST_API_KEY=발급받은_REST_API_키
KAKAO_CLIENT_SECRET=활성화된_경우_해당_시크릿
KAKAO_REDIRECT_URI=http://localhost:8080/api/v1/auth/kakao/callback
STAGEPIN_WEB_URL=http://localhost:8081
```

```sh
docker compose -f infra/compose.yaml up -d --build api
```

`http://localhost:8081/my`에서 확인한다. 키 미설정 시 앱은 계속 동작하고 로그인 버튼은 준비 중으로 표시한다. 키가 있다고 콘솔 설정이나 실제 인증 성공까지 보장하는 것은 아니다.

## 배포 설정 (아직 자동 배포하지 않음)

카카오 콘솔에 `https://stage-pin-api.onrender.com/api/v1/auth/kakao/callback`도 등록한다. Render의 환경 변수는 아래처럼 설정한다.

```dotenv
KAKAO_REST_API_KEY=동일한_REST_API_키
KAKAO_CLIENT_SECRET=활성화된_경우_해당_시크릿
KAKAO_REDIRECT_URI=https://stage-pin-api.onrender.com/api/v1/auth/kakao/callback
STAGEPIN_WEB_URL=https://stage-pin.vercel.app
```

웹은 Vercel의 `/api/v1/auth/*` 프록시를 사용한다. 쿠키를 Render 도메인에 직접 의존하지 않아 Safari의 서드파티 쿠키 차단을 피한다. 나머지 공개 공연 API 주소는 기존 설정 그대로다. Preview 도메인은 로그인 도메인으로 허용하지 않는다.

아이폰은 같은 백엔드 Redirect URI를 사용하고 완료 후 고정된 `stagepin://auth/callback`으로 복귀한다. Expo Go가 아니라 해당 scheme으로 빌드한 앱을 사용한다. `expo-crypto`, `expo-web-browser`, `expo-secure-store`를 추가했으므로 네이티브 재빌드가 필요하다. 로컬 백엔드의 localhost는 폰에서 접근할 수 없으므로 기기 테스트는 HTTPS 배포 서버로 진행한다.

## 인증 흐름과 보안

1. 클라이언트가 난수 verifier와 S256 challenge를 만든다. 웹 verifier는 일시적으로 sessionStorage, 네이티브는 SecureStore에 보관한다.
2. `POST /api/v1/auth/kakao/start`에 `client: WEB|NATIVE`, `challenge`를 전달한다. 서버는 5분 유효한 난수 state를 해시로 저장한다.
3. 카카오 callback은 state를 원자적으로 한 번만 소비한다. 서버가 카카오 토큰과 프로필을 조회한 뒤 카카오 토큰은 따로 보존하지 않는다.
4. 서버는 60초 유효한 일회용 교환 코드로 고정된 웹/앱 경로에만 리다이렉트한다. 사용자 입력 returnTo는 받지 않는다. URL에 세션 토큰이나 카카오 토큰을 넣지 않는다.
5. `POST /api/v1/auth/exchange`는 원래 verifier를 검증한 후 코드를 원자적으로 한 번만 소비한다. 잘못된 verifier는 유효 코드를 소비하지 않는다. 이 PKCE 검증은 StagePin의 앱 복귀/세션 교환 구간을 보호하며 카카오가 S256 파라미터를 처리한다고 가정하지 않는다.
6. 웹 세션 토큰은 HttpOnly·SameSite=Lax 쿠키에만 보관하고 JSON에는 반환하지 않는다. HTTPS 환경은 Secure 쿠키를 사용한다. 네이티브만 세션 토큰을 받아 SecureStore에 보관한다. 세션 만료는 7일이다.
7. DB는 세션 토큰·state·교환 코드의 SHA-256 해시만 저장한다. 만료된 인증 레코드는 매시간 정리한다. 같은 카카오 ID의 동시 가입은 트랜잭션 잠금과 유일 키로 중복 생성을 막는다.
8. 쿠키를 사용하는 웹 교환·로그아웃 요청은 정확히 일치하는 Origin을 검사한다. 인증 API의 credential CORS도 고정된 웹 Origin만 허용한다. 인증 응답은 no-store다.

`GET /api/v1/auth/config`는 활성 여부만 반환한다. `GET /api/v1/auth/me`는 비로그인 시 401, 로그인 시 회원의 id/nickname/imageUrl/email(없으면 null)을 반환한다. `POST /api/v1/auth/logout`은 해당 세션만 무효화하며 카카오톡 계정 자체에서 로그아웃하지 않는다.

완료 안내는 실제 세션 교환 성공 후에만 표시하고, 새로고침 때 재표시하지 않는다. 이메일 선택 동의를 하지 않아도 로그인·기존 찜 기능은 유지한다. 이메일 동의 목적에는 '회원 프로필 및 계정 정보 표시'처럼 실제 용도를 기입하고, 공개 운영 전 개인정보처리방침의 수집 항목·목적·보유 기간에도 반영해야 한다.

## 검증 및 남은 작업

- 컨트롤러: 키 미설정, state 실패, 고정 리다이렉트, 웹 Origin, HttpOnly/Secure 쿠키, 네이티브 토큰, 교환 재사용, 비로그인/로그아웃.
- 클라이언트: 운영 웹 동일 출처 프록시, 네이티브 복귀 URI 검증, 취소 메시지.
- 카카오 HTTP 모의 서버: 서버 측 토큰 교환, 프로필 조회, 프로필 동의 없음.
- 임시 실제 PostgreSQL: state·교환 코드 재사용 차단, 만료, 잘못된 verifier, 해시 세션, 동시 가입. 테스트 클래스는 `AUTH_TEST_JDBC_URL`이 `/stagepin_auth_test`로 끝나는 별도 DB에서만 실행된다.
- 실제 카카오 계정의 운영 웹 로그인→복귀, 새로고침 후 유지, 로그아웃·재로그인은 2026-11-05 확인했다. [운영 검증 기록](release-verification-2026-11-05.md)을 참고한다. iOS 설치 앱 검증은 별도이며 사용자 동의는 사용자가 직접 진행한다.
- 회원 공개 운영 전 개인정보처리방침·회원 탈퇴 및 카카오 연결 해제, 로그인 시도 제한을 추가해야 한다. 현재 이를 제공한다고 표시하지 않는다. 공개 배포를 이 문서가 승인하는 것은 아니다.
- 회원별 일정·굿즈 찜 동기화, Apple 로그인, 계정 연결은 다음 작업이다. 아티스트·공연 찜의 계정 저장은 `account-favorites.md`를 참고한다. 굿즈 생성 소유권은 세션에 연결했지만 수정/삭제 API와 거래 신청 권한은 이번 범위가 아니다.

## 공식 자료와 버튼 출처

- https://developers.kakao.com/docs/ko/kakaologin/rest-api
- https://developers.kakao.com/docs/ko/kakaologin/design-guide
- 공식 버튼 SVG: https://developers.kakao.com/tool/images/resource/preview/login-complete-ko.svg
- `mobile/assets/kakao-login-official.png`는 위 원본을 비율 유지해 PNG로 변환한 것이다. 심볼·색상·문구를 임의 변경하지 않는다.
- https://docs.expo.dev/versions/v58.0.0/sdk/webbrowser/
- https://docs.expo.dev/versions/v58.0.0/sdk/securestore/

## 2026-11-05 성공/실패 시나리오 검증

여기서 A/B는 사용자 대상 전환율 실험이 아니라 정상(A)·실패(B) 경로의 자동 회귀 테스트를 의미한다.

- A 웹: 시작 → 고정 callback → 일회용 코드 교환 → HttpOnly/Secure 쿠키 → 반복 세션 조회 → 로그아웃 → 401.
- A 네이티브: 고정 scheme 복귀 → 잘못된 verifier 거부 후 올바른 교환 성공 → Bearer 세션 조회 → 로그아웃 → 401.
- B: 동의 취소, provider 오류, callback state 재사용, 교환 코드 재사용/만료/동시 교환, 잘못된 Origin을 검증한다. 카카오 인증 응답은 모의 객체이고 저장·조회·삭제는 임시 실제 PostgreSQL을 사용한다.
- `MemberAuthStoreDatabaseTest` 7개, 인증 컨트롤러 7개, 카카오 HTTP 클라이언트 3개, 세션 접근 2개를 실행했다. 실제 카카오 계정 동의와 iPhone 브라우저/앱 복귀를 이 자동 테스트가 대신하지 않는다.
- CI backend job에 임시 PostgreSQL 서비스를 추가해 `AUTH_TEST_JDBC_URL` 조건부 인증 테스트가 실행되도록 했다. 운영 키는 CI에 넣지 않는다.
- 운영 읽기 점검: Vercel 홈 200, Vercel 인증 프록시 및 Render 인증 설정 API 200과 `kakaoEnabled: false`, Vercel 비로그인 `/me` 401. 최초 백엔드 요청은 시간 초과였으며 이후 응답했다. 비활성의 코드상 조건은 비어 있는 `KAKAO_REST_API_KEY`다. 재배포만으로 키가 채워지지 않는다.
- 로컬 웹의 공식 로그인 버튼 → 카카오 계정 로그인 화면 진입까지 확인했다. 실제 계정 입력·동의·복귀 검증은 사용자 참여가 필요하다.

위 비활성 응답은 초기 점검 시점의 결과다. 이후 사용자가 Render 환경 변수를 반영했고, 로컬 실제 계정 복귀와 운영 웹의 로그인·세션 유지·로그아웃·재로그인 및 회원 소유 굿즈 저장까지 확인했다. 최종 상태와 제한은 [배포 검증 기록](release-verification-2026-11-05.md)에 둔다.
