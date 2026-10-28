# StagePin

StagePin connects concert discovery, ticket-opening schedules, and fan-to-fan
goods sales and exchanges, including meetups at the same performance.
The current goods marketplace is a local-only prototype: listings, requests,
and artwork are previews, not real publishing, messaging, or payments.

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
# 아티스트 사진은 Wikidata/Wikimedia Commons를 사용하므로 별도 키가 필요 없습니다.
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

The concert-detail map uses Kakao Maps on web and inside the native app when
`EXPO_PUBLIC_KAKAO_MAP_JAVASCRIPT_KEY` is set. Register
`http://localhost:8081` and `https://stage-pin.vercel.app` as JavaScript SDK
domains in Kakao Developers. Without a key, the detail page provides a direct
link that opens the venue in Kakao Maps instead of rendering a broken map.

The decorative Korean peninsula silhouette is derived from Natural Earth 1:10m
public-domain country geometry and simplified for the StagePin map card.

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

### Artist search and reusable photos

Artist names, multilingual aliases and stable IDs come from MusicBrainz.
Wikidata links the MusicBrainz ID to an image, and Wikimedia Commons supplies
the photo URL, author, source page and license. No Spotify account, subscription
or image API key is needed. Existing Spotify credentials in a local `.env` are
not used or passed into the API container.

Only supported CC BY / CC BY-SA / CC0 photos or verified Public domain photos
with the required metadata are displayed. The UI center-crops images to fill
the square profile, preserves aspect ratio and exposes credits and the crop notice via ⓘ.
Missing or unverified photos use a default icon; latest official profile photos
and coverage of every artist are not guaranteed. Search results are cached for
six hours. See [source and license rules](docs/artist-profile-sources.md), including
the separate MusicBrainz hosted-API terms to review before commercial operation.

### Performance data

The API reads the next 31 days of Korean popular-music performances from the
official KOPIS Open API (`shcate=CCCD`). It combines performance details with
facility coordinates, caches up to 12 results for 30 minutes, and falls back to
the Korean PostgreSQL demo record when the key is missing or KOPIS is
unavailable. Keep `KOPIS_API_KEY` only in the ignored `infra/.env` file.

KOPIS does not provide fan-presale or general-sale start times. Those schedules
are stored separately as StagePin-verified ticket openings. Set
`STAGEPIN_ADMIN_KEY` and use `POST /api/v1/admin/ticket-openings` with the
`X-StagePin-Admin-Key` header to register a date only after checking an official
artist, agency, or organizer notice. The public mobile feed reads upcoming
verified entries from `GET /api/v1/ticket-openings`; ticket-vendor pages are not
scraped or copied.
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
