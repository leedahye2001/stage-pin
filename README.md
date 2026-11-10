# StagePin

**공연을 찾고, 팬 굿즈를 나누는 서비스**

국내 공연과 예매처를 탐색하고, 관심 아티스트의 공연을 모아 보며, 팬 사이의 굿즈 판매와 교환 글을 등록하는 개인 포트폴리오 프로젝트입니다.

[서비스 바로가기](https://stage-pin.vercel.app/) | [아키텍처](docs/architecture.md) | [ERD](docs/erd.md) | [기술 의사결정](docs/auth-goods-technical-decisions.md)

> 현재는 공연 탐색, 회원별 아티스트/공연 찜, 개인 일정, 굿즈 게시글과 사진 저장을 제공합니다. 결제, 채팅, 거래 신청과 실시간 현장 매칭은 아직 제공하지 않습니다.

## 1. 프로젝트 개요

| 항목 | 내용 |
| --- | --- |
| 개발 형태 | 개인 프로젝트. 기획, 클라이언트, API, DB 설계, 테스트와 배포 구현 |
| 서비스 범위 | 공개 공연 탐색, 카카오 로그인, 회원별 찜, 굿즈 판매/교환 게시글 등록 |
| 실행 구조 | Expo 웹/iOS 클라이언트, 도메인별 패키지로 구성한 Spring Boot 단일 서버, PostgreSQL |
| 운영 환경 | 웹은 Vercel, API는 Render Docker 서비스, 데이터는 별도 PostgreSQL |
| 주요 검토 지점 | 세션 소유권, 계정 전환, 이미지 검증, 원자적 저장, 중복 요청과 외부 데이터 실패 처리 |

### 코드 검토 시작점

| 검토 항목 | 구현 | 검증 근거 |
| --- | --- | --- |
| 인증과 세션 | [인가/세션 교환](backend/src/main/java/com/leedahye/stagepin/auth/MemberAuthController.java), [세션과 Origin 검사](backend/src/main/java/com/leedahye/stagepin/auth/MemberSessionAccess.java) | [인증값 소비와 회원 동시 생성 DB 테스트](backend/src/test/java/com/leedahye/stagepin/auth/MemberAuthStoreDatabaseTest.java) |
| 굿즈 저장 정합성 | [글/사진 트랜잭션과 멱등 등록](backend/src/main/java/com/leedahye/stagepin/goods/GoodsRepository.java), [DB 제약](backend/src/main/resources/db/migration/V8__create_goods_listings.sql) | [재조회, 회원 분리, 중복과 롤백 테스트](backend/src/test/java/com/leedahye/stagepin/goods/GoodsRepositoryDatabaseTest.java) |
| 계정별 찜 | [행 잠금과 upsert](backend/src/main/java/com/leedahye/stagepin/favorite/FavoritesStore.java), [클라이언트 상태](mobile/src/lib/favorites.tsx) | [회원 분리와 한도 롤백 DB 테스트](backend/src/test/java/com/leedahye/stagepin/favorite/FavoritesStoreDatabaseTest.java) |
| 외부 연동 실패 | [KOPIS 상세/시설 조회](backend/src/main/java/com/leedahye/stagepin/concert/KopisConcertClient.java) | [상세 실패와 재조회 테스트](backend/src/test/java/com/leedahye/stagepin/concert/KopisDetailFailureTest.java) |

설계 배경은 아래 기술 의사결정에, 전체 모델과 API 계약은 연결된 설계 문서에 정리했습니다. 테스트 코드가 있다는 사실과 실제 운영 부하에서 검증됐다는 주장은 구분합니다.

## 2. 현재 구현된 기능

| 영역 | 사용자 흐름 | 데이터와 저장 방식 |
| --- | --- | --- |
| 홈 | 공연 포스터 캐러셀, 공개 공연과 굿즈 탐색. 관심 아티스트가 있는 회원에게 관련 공연 표시 | 실제 조회 결과 사용. 확인된 미래 예매 오픈 일정이 있을 때만 해당 영역 노출 |
| 검색과 공연 상세 | 아티스트/공연 검색, 과거 공연, 포스터, 상태, 예매처 이동 | KOPIS 공연과 시설 상세. 예매 오픈 시각은 별도 데이터 |
| 아티스트 | 이름과 다국어 별칭 검색, 사진, 관련 공연 | MusicBrainz, Wikidata, Wikimedia Commons. 사진 이용 정보 확인 후 표시 |
| 지도 | 공연장별 공연 묶음, 기간/지역 필터, 마커와 목록 연결 | 확인된 시설 좌표만 사용. 웹 위치 허용 시 직선 거리순 정렬 |
| 로그인과 MY | 카카오 로그인, 프로필, 내 등록 굿즈와 찜 목록 | PostgreSQL 회원/세션. 비로그인 상태에는 개인 목록을 노출하지 않음 |
| 아티스트/공연 찜 | 로그인 후 추가/해제, 재접속 후 조회 | 회원별 PostgreSQL 저장. 비로그인 하트는 로그인 화면으로 이동 |
| 굿즈 | 판매/교환 등록, 가격과 상태 검증, 사진 1~5장, 목록/상세와 내 글 조회 | 글과 재인코딩한 사진을 PostgreSQL에 함께 저장 |
| 내 일정 | 공연/예매 일정 선택, 월 달력, 필터, 예매처 이동 | 기기 AsyncStorage. 찜과 구분하며 계정 동기화는 없음 |

PC와 모바일의 레이아웃을 구분하고 API 대기는 스켈레톤으로 표현합니다. Expo 기반 iOS 개발 빌드도 구성했지만 웹 배포와 설치된 앱의 갱신은 별도입니다.

### 데이터 범위에 대한 원칙

- KOPIS는 모든 팬미팅과 페스티벌을 보장하지 않습니다. 검색 결과를 전체 공연 데이터라고 표현하지 않습니다.
- 홈은 대중음악 공연 최대 300건을 후보로 조회하고, 팬콘/단독 공연/투어 등 제목 기반 규칙과 시작일로 정렬해 최대 12개를 표시합니다. 실제 인기 순위나 학습 기반 추천은 아닙니다.
- 과거 공연도 검색하지만 현재 검색은 KOPIS 첫 페이지를 기반으로 최대 30건을 반환합니다.
- KOPIS가 제공하지 않는 선예매/일반예매 시작 시각은 추측하지 않습니다. 별도로 확인한 일정만 저장하고 공개합니다.
- 누락된 출연진이나 예매 링크를 임의 생성하지 않습니다. 미확인 좌표는 지도에서 제외합니다.

## 3. 기술 구성과 아키텍처

| 계층 | 사용 기술 | 역할 |
| --- | --- | --- |
| 클라이언트 | React Native 0.88, Expo SDK 58, React 19, TypeScript | 웹과 네이티브 화면 공유 |
| 라우팅과 상태 | Expo Router, TanStack Query, Context, AsyncStorage | 화면 이동, 서버 조회 캐시, 계정 상태와 기기 일정 분리 |
| 백엔드 | Java 21, Spring Boot 4.1, Spring MVC, Spring Security | REST API, 외부 응답 변환, 인증과 입력 검증 |
| 데이터 | PostgreSQL, Spring Data JPA, JdbcTemplate, Flyway | 도메인 저장, 명시적 SQL과 트랜잭션, 스키마 버전 관리 |
| 외부 연동 | KOPIS, MusicBrainz, Wikidata, Wikimedia Commons, Kakao Maps | 공연, 아티스트, 사진 이용 정보와 지도 |
| 배포 | Docker, Docker Compose, Render, Vercel | 로컬 API/DB, 컨테이너 API 운영, 정적 웹과 인증 API 프록시 |
| 검증 | JUnit, MockMvc, 격리 PostgreSQL, Node Test Runner, GitHub Actions | 로직, API 계약, 실제 SQL과 클라이언트 회귀 검사 |
| 로컬 실험 | Spring AI, Ollama | 공지에서 예매 일정 추출 후 사람의 검수 |

**도메인 패키지로 나눈 단일 Spring Boot 서버**입니다. 현재 규모에서 마이크로서비스, 메시지 큐, Redis를 추가하지 않았습니다.

공개 공연 조회는 클라이언트에서 API를 거쳐 외부 KOPIS 응답을 변환하는 경로이고, 굿즈/찜 쓰기는 API에서 세션을 검증한 뒤 PostgreSQL에 저장하는 경로입니다. 지도 SDK는 클라이언트에서 렌더링합니다. 외부 응답 캐시와 영속 데이터는 별도로 관리합니다.

- **Vercel**: Expo 웹 export 결과 제공. 인증, 굿즈, 찜 API는 Render로 프록시합니다.
- **Render**: 멀티 스테이지 Docker 이미지로 Spring API 실행. 비루트 사용자를 사용합니다.
- **PostgreSQL**: 회원, 세션, 굿즈, 사진, 찜, 확인된 예매 일정 등을 저장합니다. KOPIS 응답 전체를 자동 적재하지는 않습니다.
- **조회 캐시**: JVM 메모리에서 KOPIS 30분, 아티스트 검색 6시간 캐시. 재시작이나 인스턴스 간 공유는 보장하지 않습니다.
- **스키마**: Flyway V1~V9로 변경을 관리하고 Hibernate `ddl-auto=validate`로 검증합니다.

[시스템 구성 상세](docs/architecture.md) | [실제 스키마와 관계](docs/erd.md) | [API와 데이터 흐름](docs/data-flows.md)

## 4. 핵심 기술 의사결정과 문제 해결

### 카카오 인증과 서비스 세션 분리

카카오는 신원을 확인하는 수단이고, StagePin 접근 권한은 자체 세션으로 관리합니다.

- 인가 코드 교환과 프로필 조회는 서버에서 처리합니다. 카카오 토큰과 Client Secret을 클라이언트 세션으로 전달하지 않습니다.
- 일회성 `state`와 짧은 수명의 handoff code를 사용합니다. 자체 세션 교환 구간에서 S256 verifier를 검증해 코드만 탈취한 요청의 세션 발급을 막습니다. 카카오 측 PKCE를 구현했다고 가정하지 않습니다.
- 웹은 HttpOnly 쿠키, 네이티브는 SecureStore의 Bearer 토큰을 사용합니다. 서버에는 세션 원문 대신 SHA-256 해시를 저장합니다.
- 쿠키 쓰기는 정확한 Origin을 검사합니다. CORS만으로 인증을 대신하지 않습니다.

운영에서 Vercel wildcard rewrite가 collection URL에 끝 슬래시를 붙여 Spring 경로와 불일치하는 문제가 있었습니다. API 권한을 풀지 않고 **exact rewrite를 wildcard보다 먼저 배치**하고 경로 순서를 회귀 테스트로 고정했습니다.

근거: [인증 코드](backend/src/main/java/com/leedahye/stagepin/auth), [프록시](mobile/vercel.json), [회귀 테스트](mobile/tests/vercel-rewrites.test.mjs), [로그인 설계](docs/kakao-login.md)

### 굿즈 사진 검증, 원자적 저장과 중복 등록 방지

가격 입력 제한과 사진 선택 UI만으로는 직접 API 요청이나 중간 실패 상태를 막을 수 없습니다.

- 서버에서 가격, 교환 조건, 상태 enum, 거래 방식과 사진 수를 다시 검증합니다. 작성자는 본문이 아닌 인증된 세션에서 결정합니다.
- JPEG/PNG를 실제 디코딩하고 크기를 제한한 뒤 긴 변 1600px 이하 JPEG로 재인코딩합니다. 원본 EXIF/GPS 메타데이터는 보관하지 않습니다.
- 이미지 변환은 트랜잭션 밖에서 수행하고 글과 모든 사진의 INSERT는 한 트랜잭션으로 묶습니다. 사진 저장 실패 시 글만 남지 않습니다.
- `(owner_id, request_id)` 유일 제약으로 동일 등록의 재전송을 중복 글로 저장하지 않습니다.
- 목록은 사진 메타데이터만 조회하고 이미지 본문은 별도 API로 제공합니다.

소규모 단계에서 별도 스토리지 없이 영속성을 확보하기 위해 **PostgreSQL BYTEA**를 선택했습니다. 임시 컨테이너 디스크에 의존하지 않는 대신 DB 용량과 백업 부담이 커집니다. 이미지 수가 늘면 객체 저장소와 CDN으로 분리해야 합니다.

근거: [굿즈 코드](backend/src/main/java/com/leedahye/stagepin/goods), [V8 스키마](backend/src/main/resources/db/migration/V8__create_goods_listings.sql), [저장과 검증 상세](docs/goods-persistence.md)

DB에도 판매/교환에 따른 가격 조건, 거래 방식, 현장 공연명, 사진 크기와 순서 제약을 둡니다. 사진 필수 개수와 파일 내용 검사는 서비스에서 수행합니다. 애플리케이션 검증과 DB 제약이 각각 보장하는 범위를 구분합니다.

### 계정 전환과 동시 요청을 고려한 찜 저장

외부 아티스트와 공연 ID가 내부 카탈로그에 항상 존재하지 않으므로 회원 FK, 외부 ID, JSONB 표시 스냅샷을 저장합니다.

- `(member_id, kind, target_id)` 유일 키와 대상별 추가/해제로 중복을 막습니다. 전체 목록 덮어쓰기로 다른 기기의 변경을 지우지 않습니다.
- 회원 행 잠금과 트랜잭션으로 회원별 200개 한도를 동시 요청에서도 지킵니다.
- 회원 ID가 포함된 query key로 캐시를 구분하고 늦은 응답은 현재 계정과 일치할 때만 적용합니다.
- 쓰기의 예상 회원 ID와 실제 세션을 비교해 계정 전환 도중 다른 회원에게 저장되는 요청을 거부합니다. 이 ID가 소유권을 부여하지는 않습니다.
- 저장 실패를 로컬 성공으로 대체하지 않습니다. 로그아웃하면 개인 목록을 숨기고 비로그인 찜은 로그인으로 안내합니다.

굿즈 하트는 아직 메모리 상태이며 아티스트/공연 찜과 같은 영속 저장이라고 표현하지 않습니다.

근거: [찜 서버](backend/src/main/java/com/leedahye/stagepin/favorite), [클라이언트 상태](mobile/src/lib/favorites.tsx), [계정 찜 설계](docs/account-favorites.md)

스냅샷은 회원의 표시용 데이터이지 외부 카탈로그의 최신 원본이 아닙니다. 카탈로그 FK를 강제하지 않는 대신, 원본 변경과 이미지 URL 만료를 자동 추적하지 못하는 한계가 있습니다. 회원별 행 잠금은 단순한 쓰기 직렬화를 제공하지만 같은 회원의 요청이 집중되면 대기가 생길 수 있습니다.

### 외부 데이터의 누락과 지도 좌표 오류 처리

지역 대표 좌표를 공연장 핀으로 사용하면 올림픽공원 공연이 다른 위치에 표시될 수 있습니다.

- KOPIS 시설 상세의 위경도를 사용합니다. 미확인 좌표는 `(0, 0)`으로 구분하고 지도에서 제외합니다.
- 저장된 공연 스냅샷도 시설 상세로 보완해 과거의 잘못된 좌표를 재사용하지 않습니다.
- 상세 조회 실패를 정상 상세로 캐시하지 않습니다. 조회 실패와 실제 예매 링크 없음은 다른 상태로 다룹니다.
- 아티스트 사진은 Commons 파일의 저자와 지원 라이선스를 확인합니다. 미확인 이미지는 기본 아이콘으로 대체하고 출처 정보를 제공합니다.

근거: [KOPIS 연동](backend/src/main/java/com/leedahye/stagepin/concert/KopisConcertClient.java), [지도 정책](docs/map-tab.md), [사진 출처 정책](docs/artist-profile-sources.md)

## 5. AI 활용: 자동 게시가 아닌 검수 보조

KOPIS만으로 확보할 수 없는 예매 시각을 보완하기 위해 **운영자가 입력한 공식 공지 텍스트에서 후보를 추출하는 로컬 프로토타입**을 구현했습니다.

- Spring AI와 Ollama로 공연명, 예매 시각, 예매처, URL과 원문 인용문을 추출합니다.
- 추출값과 원문 근거, 모델/프롬프트 버전, 응답 시간과 토큰 수를 저장합니다.
- 원문 인용 포함 여부와 날짜/링크를 검증하고, 사람이 수정하고 승인한 결과만 공개합니다. 인용 일치가 사실 정확도를 보장하지는 않습니다.
- 승인 트랜잭션과 행 잠금으로 재승인 중복 생성을 막습니다.
- 합성 공지 20개의 선택 실행 평가 코드가 있습니다. 평가 목표를 측정 성과로 표현하지 않습니다.

**운영 모델 서버는 배포하지 않았고 MY의 관리자 진입 메뉴도 제거했습니다.** URL 자동 크롤링, OCR, RAG, 벡터 DB는 사용하지 않습니다. 일반 공연 탐색과 굿즈 기능은 모델 서버에 의존하지 않습니다.

[추출과 검수 설계, 평가 실행 조건](docs/ai-notice-review.md)

## 6. 테스트와 배포 절차

| 검증 층 | 확인하는 내용 |
| --- | --- |
| 클라이언트 Node 테스트 | 폼 검증, 응답 매핑, 공개 공연 필터, 계정 상태, 하트 이벤트, 프록시 경로 |
| 단위 테스트와 MockMvc | 인증/Origin 실패, 잘못된 입력, 외부 응답 누락, API 계약 |
| 격리 PostgreSQL 통합 테스트 | 일회성 인증값 소비, 회원 분리, 글/사진 롤백, 재조회, 멱등성, 찜 한도 |
| 빌드와 정적 검사 | ESLint, TypeScript, Expo Doctor, 웹 export |
| 운영 확인 | 배포 커밋, DB 마이그레이션, health, 공개 API와 비로그인 401, 실제 화면 |

GitHub Actions는 PR마다 Java 21/Node 24에서 backend와 mobile을 검사합니다. 인증과 굿즈용 PostgreSQL을 따로 실행해 실제 SQL 테스트를 수행합니다. 찜 DB 테스트는 굿즈 테스트 DB의 별도 스키마를 사용합니다.

- backend 필수 검사: `./gradlew test --no-daemon`과 연결된 테스트 DB.
- mobile 필수 검사: clean install, lint, 타입 검사, Node 테스트, Expo Doctor.
- 웹 export는 현재 GitHub CI 단계에 포함되지 않습니다. 웹 코드 변경 시 로컬 검사와 Vercel 빌드에서 확인합니다.
- 실제 Ollama 평가, 브라우저 OAuth, iPhone 실행은 별도 검증입니다. 조건부 테스트의 skip을 해당 기능의 검증 성공으로 계산하지 않습니다.

작업 브랜치 → PR → 최신 커밋의 필수 CI 성공 → main 병합 순서를 따릅니다. 운영 수동 배포는 별도 단계이며, 필요한 백엔드 마이그레이션을 먼저 완료한 뒤 프론트를 전환합니다.

운영에서는 `/actuator/health`와 호스팅 로그로 기동/마이그레이션을 확인하고, 공개 조회와 비로그인 쓰기 차단을 별도로 검사합니다. 브라우저 인증과 사진 저장 검증 기록은 [릴리스 검증 문서](docs/release-verification-2026-11-05.md)에 있습니다. 응답 시간, 처리량, 대규모 동시 접속에 대한 측정 결과는 아직 없습니다.

## 7. 로컬 실행

필요 환경: Node.js 24, Docker 호환 런타임. 서버를 컨테이너 밖에서 빌드할 때는 Java 21이 필요합니다.

### API와 PostgreSQL

저장소 루트에서 실행합니다.

```bash
cp infra/.env.example infra/.env
# infra/.env에 KOPIS 서비스 키를 입력합니다.
# 카카오 로그인에는 REST 키, Client Secret, Redirect URI 설정도 필요합니다.
docker compose -f infra/compose.yaml up --build
```

API: `http://localhost:8080`, health: `http://localhost:8080/actuator/health`.
DB는 내부 네트워크와 볼륨을 사용합니다. 초기 마이그레이션의 데모 데이터는 실제 홈 공연과 구분합니다.

### 웹 클라이언트

```bash
cd mobile
cp .env.example .env
npm ci
npm run web -- --port 8081
```

- `EXPO_PUBLIC_API_URL` 기본값은 `http://localhost:8080`입니다.
- 카카오맵에는 `EXPO_PUBLIC_KAKAO_MAP_JAVASCRIPT_KEY`와 허용 도메인 등록이 필요합니다.
- 서버 키와 토큰은 `EXPO_PUBLIC_*`에 넣지 않습니다. 아티스트 사진에는 Spotify 키나 구독이 필요하지 않습니다.
- 로컬 카카오 Redirect URI는 `http://localhost:8080/api/v1/auth/kakao/callback`입니다. [설정 상세](docs/kakao-login.md)

### 검사 명령

저장소 루트에서 클라이언트 검사를 실행합니다.

```bash
cd mobile
npm run lint -- --no-cache
npx tsc --noEmit
node --test tests/*.test.mjs
npx expo-doctor
npm run build:web
```

서버 검사는 별도 터미널에서 저장소 루트를 기준으로 실행합니다.

```bash
cd backend
./gradlew test --no-daemon
```

DB 테스트에는 새 테스트 전용 DB와 `AUTH_TEST_JDBC_URL`, `GOODS_TEST_JDBC_URL`이 필요합니다. 없으면 해당 테스트는 skip됩니다. 운영/개발 DB를 테스트 대상으로 사용하지 않습니다. [CI 구성](.github/workflows/ci.yml)과 [테스트 조건](docs/auth-goods-technical-decisions.md)을 참고합니다.

iOS는 Xcode와 서명 설정 후 `mobile/`에서 `npm run ios:device`로 개발 빌드를 설치합니다. 실기기에는 접근 가능한 API 주소를 지정해야 하며 Metro 없이 실행하려면 Release 번들이 필요합니다. 웹 CI 성공을 실기기 실행 성공으로 간주하지 않습니다.

## 8. 저장소 구조

```text
stage-pin/
├── mobile/                    Expo 앱과 웹
│   ├── src/app/               탭, 상세, 등록과 로그인 라우트
│   ├── src/api/               API 계약과 응답 처리
│   ├── src/components/        공통 UI와 플랫폼별 지도/탭
│   ├── src/lib/               회원 상태, 찜, 일정과 도메인 로직
│   └── tests/                 클라이언트 회귀 테스트
├── backend/
│   ├── src/main/java/         auth, concert, artist, favorite, goods 등
│   ├── src/main/resources/db/ Flyway 마이그레이션
│   └── src/test/              단위, API와 DB 통합 테스트
├── infra/                     로컬 Docker Compose
├── docs/                      설계, 기술 선택과 검증 기록
└── .github/workflows/         PR 검증 파이프라인
```

## 9. 현재 한계와 다음 단계

- 굿즈 글과 사진은 저장되지만 수정/삭제, 거래 상태 전환, 결제/환불, 채팅, 거래 신청은 미구현입니다.
- 현장 교환은 게시글의 거래 방식과 공연명으로 표현합니다. 실시간 위치 공유나 상대 매칭은 없습니다.
- 굿즈 찜은 메모리, 내 일정은 기기에 저장합니다. 모두 계정에 영구 저장되는 것은 아닙니다.
- 운영 푸시 알림 서비스는 제공하지 않습니다.
- 회원 탈퇴/연결 해제, 신고/차단, 업로드 quota와 시도 제한, 개인정보처리방침 등 공개 거래 서비스에 필요한 장치를 추가해야 합니다.
- 외부 데이터의 누락과 사진 이용 조건은 계속 관리해야 합니다. 비상업 프로젝트라는 이유로 모든 자산을 자유롭게 사용할 수 있다고 가정하지 않습니다.
- 로그북과 모의 티켓팅은 이전 실험 코드로 남아 있지만 현재 핵심 메뉴에서는 제외했습니다.

다음 우선순위는 거래 흐름의 완성, 사용자 보호 장치, 사진 저장소 분리입니다. 새 기술을 늘리기보다 현재 데이터의 소유권과 상태 전이를 먼저 완성하려고 합니다.
