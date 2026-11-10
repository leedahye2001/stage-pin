# 모바일·웹 변경 제약

- npm lockfile을 유지하고 다른 패키지 매니저의 lockfile을 섞지 않는다. Node 버전은 `.github/workflows/ci.yml`과 맞춘다.
- Expo/React Native API를 변경할 때 `package.json`의 Expo SDK 버전을 확인하고 해당 버전 공식 문서를 조회한다. 기존 코드와 무관한 최신 SDK 예제를 그대로 적용하지 않는다.
- DOM·브라우저 지도 SDK는 `.web.tsx` 경계에 둔다. `AppTabs.ios.tsx`와 일반 구현처럼 플랫폼별 파일이 나뉜 경우 public props와 행동을 함께 확인한다.
- 생성된 네이티브 자산만 수정해 원본 설정과 불일치시키지 않는다. 네이티브 변경 전 `app.json`/config plugin과 기존 iOS/Android 프로젝트의 수동 변경 여부를 확인한다.
- 웹 배포는 설치된 iPhone 앱을 갱신하지 않는다. 네이티브 모듈·설정 변경은 재빌드가 필요하며, 웹 빌드 성공을 실기기 실행 성공으로 보고하지 않는다. 빌드 방식은 기존 스크립트를 확인하고 EAS로 임의 전환하지 않는다.

## API 프록시 회귀

- `vercel.json`에서 `/api/v1/goods` exact rewrite는 `/api/v1/goods/:path*`보다 먼저 둔다. 빈 wildcard가 collection URL 끝에 `/`를 붙여 운영 403을 만든 이력이 있다.
- API rewrite는 SPA fallback보다 앞에 둔다. 경로 문제를 서버 인증·Origin·CORS 완화로 해결하지 않는다. 변경 시 `tests/vercel-rewrites.test.mjs`로 exact/nested 경로와 순서를 검증한다.

## Commands

아래 명령은 모두 저장소의 `mobile/`에서 실행한다. 실행·검증·의존성 변경을 구분하며, 목록에 있다는 이유만으로 전부 실행하지 않는다.

### 실행

서버 실행 요청 시 기존 8081 프로세스를 먼저 확인하고 중복 실행하지 않는다. iPhone 빌드·설치는 요청받았을 때만 수행한다.

```bash
npm run web -- --port 8081  # 웹 개발 서버
npm start                  # Metro 개발 서버 (네이티브 개발)
npm run ios:device         # 연결된 iPhone용 빌드·설치 (Xcode/서명 필요)
```

### 검증

앱 코드 변경은 lint·타입 검사·Node 테스트를 실행한다. 웹 영향 시 웹 빌드와 화면 확인, 의존성/Expo 설정 변경 시 expo-doctor를 추가한다. 문서 전용 검증·생략 보고는 루트 지침을 따른다.

```bash
npm run lint -- --no-cache
npx tsc --noEmit
node --test tests/*.test.mjs
npm run build:web
npx expo-doctor
```

### 의존성 변경

설치가 필요하면 lockfile 기준으로 설치한다. Expo/React Native 패키지는 SDK 호환 버전을 고르는 `expo install`을 사용한다. `--fix`는 진단된 호환성 문제를 수정할 때만 실행하고 package.json/lockfile diff를 검토한다.

```bash
npm ci
npx expo install <package>
npx expo install --fix
```
