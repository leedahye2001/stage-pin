# StagePin

StagePin is a mobile concert companion for discovering upcoming shows on a map,
tracking ticket-sale schedules, and preparing for show day. The same concert
record will later power setlists and a personal concert logbook.

## Repository

- `mobile`: React Native application built with Expo and TypeScript
- `backend`: Spring Boot REST API backed by PostgreSQL
- `infra`: local Docker Compose environment
- `docs`: architecture and API notes

## Local development

### Backend and database

Docker Desktop or another Docker-compatible runtime is required.

```bash
cd infra
cp .env.example .env
# .env의 KOPIS_API_KEY에 발급받은 서비스 키를 입력하세요.
# 네이버 관련 검색도 사용하려면 NAVER_CLIENT_ID와 NAVER_CLIENT_SECRET을 입력하세요.
docker compose up --build
```

The API is available at `http://localhost:8080`; its health endpoint is
`http://localhost:8080/actuator/health`. Flyway creates the schema and inserts
three clearly marked demo concerts on the first startup.

### Mobile

Node.js 22 or newer is required by Expo SDK 58.

```bash
cd mobile
cp .env.example .env
npm install
npx expo start
```

For an Android emulator, set `EXPO_PUBLIC_API_URL=http://10.0.2.2:8080`. A
physical device must use the development machine's LAN address. `expo-maps`
contains native code, so use an Expo development build for full map testing.

The web build uses Kakao Maps when `EXPO_PUBLIC_KAKAO_MAP_JAVASCRIPT_KEY` is
set. Register `http://localhost:8081` and `https://stage-pin.vercel.app` as
JavaScript SDK domains in Kakao Developers. Without a key, the web build falls
back to OpenStreetMap automatically.

### iOS app

Install Xcode and an iOS Simulator, then run the backend and:

```bash
cd mobile
npm run ios
```

This creates and launches an iOS development build, which is required because
`expo-maps` is not available in the App Store version of Expo Go. To use a real
iPhone, connect it to the Mac, enable Developer Mode, select a signing team in
Xcode when prompted, and run `npm run ios:device`. In `mobile/.env`, set
`EXPO_PUBLIC_API_URL` to the Mac's LAN address, for example
`http://192.168.0.10:8080`, because an iPhone cannot reach the Mac through
`localhost`.

## Verification

```bash
cd backend && ./gradlew test
cd mobile && npm run lint && npx tsc --noEmit && npx expo-doctor
```

## Design workflow

Google Stitch is used to explore screens and themes. Stitch output is treated
as a design reference, not copied into React Native as HTML/CSS. Production
tokens live in `mobile/src/theme/tokens.ts`, and reusable native components are
the source of truth for the app's design system.

## Live concert data

The API reads the next 31 days of Korean popular-music performances from the
official KOPIS Open API (`shcate=CCCD`). It combines performance details with
facility coordinates, caches up to 12 results for 30 minutes, and falls back to
the Korean PostgreSQL demo record when the key is missing or KOPIS is
unavailable. Keep `KOPIS_API_KEY` only in the ignored `infra/.env` file.

KOPIS does not provide fan-presale or general-sale start times. Those schedules
remain empty until official artist notices and ticket vendors are integrated.
Poster images are intentionally not imported until their reuse terms are
confirmed.

Artist search first shows a KOPIS-backed suggestion. Selecting it loads every
matching KOPIS performance record and plots the distinct venues on the map.
Historical list results only include a region, so those pins use approximate
regional coordinates until a venue-detail lookup can supply exact coordinates.

Optional related links come from the official NAVER API HUB web-search API.
Set `NAVER_CLIENT_ID` and `NAVER_CLIENT_SECRET` in the ignored `infra/.env`
file to enable them. Because web-search results are not structured performance
records, StagePin keeps them in a separately attributed section and links to
the original pages instead of silently mixing them into KOPIS data.
