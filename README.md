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
