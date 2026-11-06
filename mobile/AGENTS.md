# 모바일·웹 변경 제약

- npm lockfile을 유지한다. 설치는 `npm ci`, Expo/React Native 관련 패키지 추가는 SDK 호환 버전을 고르는 `npx expo install <package>`를 사용한다. 다른 패키지 매니저의 lockfile을 섞지 않는다.
- Expo/React Native API를 변경할 때 `package.json`의 Expo SDK 버전을 확인하고 해당 버전 공식 문서를 조회한다. 기존 코드와 무관한 최신 SDK 예제를 그대로 적용하지 않는다.
- DOM·브라우저 지도 SDK는 `.web.tsx` 경계에 둔다. `AppTabs.ios.tsx`와 일반 구현처럼 플랫폼별 파일이 나뉜 경우 public props와 행동을 함께 확인한다.
- 생성된 네이티브 자산만 수정해 원본 설정과 불일치시키지 않는다. 네이티브 변경 전 `app.json`/config plugin과 기존 iOS/Android 프로젝트의 수동 변경 여부를 확인한다.
- 웹 배포는 설치된 iPhone 앱을 갱신하지 않는다. 네이티브 모듈·설정 변경은 재빌드가 필요하며, 웹 빌드 성공을 실기기 실행 성공으로 보고하지 않는다. 빌드 방식은 기존 스크립트를 확인하고 EAS로 임의 전환하지 않는다.

## API 프록시 회귀

- `vercel.json`에서 `/api/v1/goods` exact rewrite는 `/api/v1/goods/:path*`보다 먼저 둔다. 빈 wildcard가 collection URL 끝에 `/`를 붙여 운영 403을 만든 이력이 있다.
- API rewrite는 SPA fallback보다 앞에 둔다. 경로 문제를 서버 인증·Origin·CORS 완화로 해결하지 않는다. 변경 시 `tests/vercel-rewrites.test.mjs`로 exact/nested 경로와 순서를 검증한다.

## 검증 (`mobile/`에서)

- 앱 코드 변경: `npm run lint -- --no-cache`, `npx tsc --noEmit`, `node --test tests/*.test.mjs`.
- 웹에 영향을 주는 변경: `npm run build:web`와 해당 화면 확인. 의존성·Expo 설정 변경: `npx expo-doctor`도 확인한다.
- Node 버전은 `.github/workflows/ci.yml`과 맞춘다. 문서 전용 검증·생략 보고는 루트 지침을 따른다.
