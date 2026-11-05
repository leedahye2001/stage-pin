This is an Expo/React Native mobile application. Prioritize mobile-first patterns, performance, and cross-platform compatibility.

## StagePin project conventions

- 이 파일은 `mobile/` 전체에 적용된다. 변경 경로의 `src/app`, `src/components`, `src/api`, `src/lib`, `src/theme`, `assets`, `tests` 안의 `AGENTS.md`도 확인한다.
- 현재 저장소는 `package-lock.json` 기반 npm 프로젝트다. CI와 맞춰 Node.js 24를 사용하고 lockfile을 함께 관리한다.
- TypeScript strict와 `@/` → `src/` 별칭을 유지한다. 기존 파일의 형식을 따르고 별도 formatter 도입으로 전체를 재작성하지 않는다.
- 웹/네이티브 공통은 React Native로 작성하고, DOM·지도 SDK 등 플랫폼 전용 구현은 기존 `.web.tsx`/`.ios.tsx` 경계를 유지한다.
- 서버 상태는 TanStack Query, 공연·아티스트 찜/내 일정은 Context/AsyncStorage를 따른다. 굿즈 글·사진은 서버 저장이며 굿즈 찜만 메모리다. 공연 찜·일정까지 계정 동기화된 것으로 취급하지 않는다.
- 앱 코드 변경 후 `npm run lint -- --no-cache`, `npx tsc --noEmit`, `node --test tests/*.test.mjs`를 실행한다. 웹 관련 변경은 `npm run build:web`도 확인한다.
- 문서만 변경한 작업은 위 앱 검사를 생략할 수 있다. 대신 경로·명령과 `git diff --check`를 확인하고 생략 사실을 보고한다.
- 웹 배포와 iPhone 설치본 갱신은 별개다. 네이티브 변경은 재빌드/실기기 실행 검증이 필요하며 서명 설정·배포는 요청 범위에서만 수행한다.

## Expo has changed — do not trust your training data

Expo ships breaking changes every SDK release. APIs you remember are likely renamed, moved, or removed. Before writing any code that touches an Expo, EAS, or React Native API:

1. Read the major version of the `expo` package in `package.json`.
2. Fetch the matching versioned docs: `https://docs.expo.dev/versions/v<major>.0.0/`
3. For anything else, fetch https://docs.expo.dev/llms.txt — an index of all Expo docs with corrections to common LLM misconceptions. Follow its links to the specific page you need; never answer from memory.

## Commands

Use `bunx` instead of `npx` if the project uses bun (`bun.lock` present).

```bash
npx expo install <package>  # ALWAYS use instead of npm/yarn/pnpm/bun add — resolves SDK-compatible versions
npx expo start              # start the dev server
npx expo lint               # lint
npx tsc --noEmit            # typecheck
npx expo-doctor             # diagnose dependency and config issues
npx expo install --fix      # fix incompatible package versions
```

Run lint and typecheck before declaring app-code changes done; documentation-only checks are described above.

## Navigation & Routing

- Use **Expo Router** for all navigation. Routes live in `src/app/` — every file there is a screen, `_layout.tsx` files define navigators. Keep non-route code (components, hooks, utils) outside `src/app/`.
- Import `Link`, `router`, and `useLocalSearchParams` from `expo-router`.
- Docs: https://docs.expo.dev/router/introduction.md

## Building with EAS

Use EAS to build, sign, and submit the app in the cloud (`eas build`, `eas submit`) and to ship over-the-air updates (`eas update`) — no local Xcode or Android Studio required. Run EAS CLI as `bunx eas-cli <command>` in Bun projects, or `npx eas-cli@latest <command>` otherwise; substitute that for bare `eas` in docs examples.
Docs: https://docs.expo.dev/eas/index.md

## Rules

- If `ios/` and `android/` directories do not exist, they are generated (Continuous Native Generation). Never create or edit them by hand — configure native behavior in `app.json` and config plugins.
- Expo Go only includes its bundled native modules. After adding a library with native code, the app needs a development build: `npx expo run:ios|android` locally, or `eas build --profile development`.
- Prefer recommended Expo modules over third-party libraries, and check your available skills before adding dependencies. Docs: https://docs.expo.dev/versions/latest/index.md
