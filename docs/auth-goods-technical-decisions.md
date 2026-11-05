# 로그인·굿즈 저장: 구현 기술과 선택 이유

## 기술 구성

프런트는 Expo/React Native + TypeScript + Expo Router, 서버 상태는 TanStack Query를 사용한다. 백엔드는 Java 21/Spring Boot와 JdbcTemplate, Flyway/PostgreSQL을 사용한다. Vercel은 정적 웹과 API 프록시, Render는 Docker 기반 Spring 서버를 담당한다. Docker는 로컬 API/DB와 격리된 테스트 실행에도 사용한다. 웹을 Vercel에 배포한다고 서버 Docker 경험이 사라지는 것은 아니다.

## 카카오 인증과 StagePin 세션을 분리한 이유

- 카카오 REST 인가 코드는 서버가 토큰으로 교환하고 프로필을 조회한다. REST 키/Client Secret과 카카오 토큰을 프런트 세션으로 전달하지 않는다.
- 카카오 회원번호로 회원을 식별한다. 이메일은 권한/동의에 따라 없을 수 있으며 이메일 일치만으로 계정을 합치지 않는다.
- 서버에 난수 state를 해시로 저장하고 5분 내 한 번만 소비해 callback 위조/재사용을 막는다. 긴 인증 대기 후에는 새 로그인 요청이 필요하다.
- callback은 60초 유효한 handoff code로 설정된 복귀 주소에만 이동한다. 원래 클라이언트의 S256 verifier를 확인한 후 StagePin 세션을 발급한다. 이는 자체 세션 교환 구간의 PKCE이며 카카오 측 PKCE 지원을 가정한 구현이 아니다.
- 웹은 HttpOnly/Secure/SameSite=Lax 쿠키, 네이티브는 Bearer + SecureStore를 사용한다. 서버에는 7일 세션의 원문이 아닌 SHA-256 해시만 저장한다. 로그아웃은 해당 StagePin 세션을 삭제하며 카카오 계정 전체 로그아웃은 아니다.
- Vercel의 `/api/v1/auth/*`, `/api/v1/goods/*`를 같은 출처 프록시로 둔다. 브라우저가 Render의 제3자 쿠키에 의존하지 않도록 한 선택이다. 쿠키 쓰기 요청은 정확한 웹 Origin을 검사한다.
- collection `/api/v1/goods`는 nested wildcard 앞에 exact rewrite를 둔다. 운영에서 wildcard가 빈 경로에 끝 슬래시를 붙여 Spring의 collection mapping과 달라지는 문제를 확인했기 때문이다. `/goods`와 `/goods/`를 같다고 가정하지 않고, 프록시 계약을 테스트한다. 403을 없애려고 인증/CORS/전체 경로 권한을 완화하지 않는다.

관련 코드: `backend/src/main/java/com/leedahye/stagepin/auth/`, `mobile/src/api/auth.ts`, `mobile/vercel.json`.

## 굿즈 글과 사진을 서버에 저장한 이유

- 화면의 메모리/로컬 미리보기는 재접속·다른 기기에서 유지되지 않는다. 실제 글·사진은 DB에 저장하고 TanStack Query로 목록/상세/내 글을 다시 조회한다.
- 내 글 query key에 회원 ID를 포함하고 비로그인 시 요청을 비활성화한다. 계정 전환 때 이전 회원의 내 글 캐시가 화면에 섞이지 않도록 한 구성이다. 이는 서버의 세션·소유권 검증을 대신하지 않는다.
- 작성자 ID는 폼이 아니라 검증된 세션에서 가져온다. `owner_id` FK와 내 글 조회 조건으로 다른 회원의 글이 MY에 섞이지 않게 한다.
- 사진 없는 글·잘못된 가격·자유 문자열 상태는 서버에서도 거부한다. UI 검증만으로는 직접 API 요청을 막을 수 없기 때문이다.
- `ImageIO`로 JPEG/PNG 실제 내용을 디코딩하고 긴 변 1600px 이하 JPEG로 재인코딩한다. 확장자/MIME만 믿지 않으며 원본 EXIF/GPS를 공개하지 않는다. 개수/바이트/픽셀 제한도 둔다.
- 이미지 변환은 쓰기 트랜잭션 전에 끝낸다. CPU 작업 동안 DB 트랜잭션을 길게 유지하지 않기 위해서다. 글과 모든 사진의 INSERT는 하나의 트랜잭션으로 묶어 중간 실패 때 부분 저장을 막는다.
- `(owner_id, request_id)` 유일 제약으로 동일 등록 재전송이 중복 글이 되는 것을 막는다. UI 버튼 비활성화만으로는 재시도/중복 전송을 완전히 제어할 수 없다.
- JdbcTemplate의 고정 파라미터 SQL과 유한한 페이지 크기, 사진 메타데이터 join을 사용한다. 목록 JSON을 만들 때 사진 BYTEA까지 읽지 않고 개별 이미지 경로로 분리한다.

관련 코드: `backend/src/main/java/com/leedahye/stagepin/goods/`, `backend/src/main/resources/db/migration/V8__create_goods_listings.sql`, `mobile/src/api/goods.ts`, `mobile/src/lib/goods-state.tsx`.

## PostgreSQL BYTEA 선택과 한계

작은 포트폴리오 단계에서 별도 스토리지 계정/키 없이 사진의 영속성과 글·사진의 원자적 저장을 확보하기 위한 선택이다. Render 임시 파일시스템에 저장하지 않는다. 대규모 이미지 서비스의 최종 권장 구조라는 뜻은 아니다. DB 용량/백업·응답 트래픽이 증가하면 객체 저장소 + 썸네일/CDN으로 분리해야 한다. 프록시의 실제 업로드 한도는 서버 설정과 별도로 검증한다.

## 테스트를 여러 층으로 나눈 이유

- Node 순수 함수 테스트: 가격/상태/폼 메타데이터·응답 매핑·홈 필터를 빠르게 검증한다. 브라우저/iPhone 업로드를 대신하지 않는다.
- MockMvc/모의 HTTP: 잘못된 입력·Origin·카카오 누락/실패 응답과 API 계약을 외부 계정 없이 반복 재현한다.
- 격리 PostgreSQL: state·교환 코드 원자적 소비, 회원 동시 가입, 글/사진 롤백, 소유자 분리, 재조회·중복 방지를 실제 SQL로 검증한다. 운영 DB를 테스트에 사용하지 않는다.
- 운영 브라우저: 실제 카카오 동의·쿠키·Vercel 프록시·사진 업로드·재접속을 확인한다. CI 통과만으로 이 부분까지 성공했다고 하지 않는다.
- CI는 Java 21/Node 24와 별도 인증·굿즈 테스트 DB를 사용한다. main 보호를 우회하지 않고 PR backend/mobile 성공 후 병합한다. 운영 반영 커밋과 기능 응답은 배포 후 별도로 확인한다.

## 이번 범위 밖

결제·채팅·거래 신청·회원별 공연 찜/일정 동기화·굿즈 수정/삭제·거래 상태 전환은 이번 범위가 아니다. 굿즈 찜도 메모리 상태다. 공개 사용자 모집 전 개인정보처리방침, 회원 탈퇴/연결 해제, 신고·차단, 업로드 quota/시도 제한이 필요하다. 운영 검증과 공개 상용 서비스 준비 완료는 다른 기준이다.

실제 진행 결과는 `release-verification-2026-11-05.md`에 기록한다.
