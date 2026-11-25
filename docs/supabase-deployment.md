# Supabase PostgreSQL 전환

## 범위

Spring API는 Render 무료 Docker 서비스, 웹은 Vercel에 유지한다. DB만 새 Supabase Free 프로젝트로 바꾼다. 만료된 Render 데이터는 이전하지 않기로 결정했으며, 새 DB의 회원/찜/굿즈는 빈 상태로 시작한다. 기존 로컬 Compose DB와 볼륨은 변경하지 않는다.

이 문서와 코드 준비만으로 운영 전환이 완료된 것은 아니다. Supabase 프로젝트 생성, Render 환경변수 변경과 배포 후 검증이 필요하다. 기존 Render DB를 자동 삭제하거나 유료 전환하지 않는다.

## 연결과 스키마

- `SPRING_PROFILES_ACTIVE=supabase`일 때만 `application-supabase.yml`을 적용한다. 로컬 Compose는 기존 public 스키마를 유지한다.
- Supabase Connect에서 **Session pooler**의 실제 host와 user를 복사한다. 포트 5432를 사용하며 transaction pooler 6543을 사용하지 않는다. 유료 IPv4 add-on은 필요하지 않다.
- JDBC 비밀번호는 URL에 넣지 않고 별도 `DB_PASSWORD`로 전달한다. JDBC 연결은 `sslmode=require`로 암호화를 요구한다. 이는 인증서 호스트 검증까지 보장하지 않는다. 인증서 검증이 필요하면 제공된 CA와 `verify-full`을 별도로 구성한다.
- Flyway가 `stagepin` 전용 스키마를 만들고 V1부터 순서대로 실행한다. Hibernate는 같은 스키마를 `validate`하며 JDBC 커넥션도 `stagepin`을 사용한다. 기존 마이그레이션은 수정하지 않는다.
- `stagepin`을 Supabase Data API의 exposed schemas에 추가하지 않는다. 기존 카카오 인증은 Spring 세션을 사용하며 Supabase Auth/RLS의 사용자 토큰으로 대체되지 않는다. Supabase 자동 API를 이용하지 않는 프로젝트라면 Data API를 비활성화한다.
- Hikari 최대 연결 3개, 최소 idle 0으로 시작한다. 연결 풀 수는 인스턴스별로 적용된다.

## 사용자 설정

1. Supabase 로그인/가입을 완료하고 **Free 조직**에 `stage-pin` 전용 새 프로젝트를 만든다. 기존 데이터가 있는 프로젝트는 사용하지 않는다. DB 비밀번호 생성/입력과 약관 동의는 사용자가 직접 한다.
2. 가능하면 Render와 가까운 Singapore 지역을 선택한다. 무료 프로젝트 한도에 도달했으면 기존 프로젝트를 삭제하거나 유료로 전환하지 말고 중단한다.
3. 프로젝트 Connect의 Session pooler를 확인한다. 프로젝트 API 키(anon/service_role)가 아니라 **DB 비밀번호**가 필요하다. 비밀번호를 채팅이나 커밋에 올리지 않는다.
4. Render의 기존 API 환경변수를 아래 값으로 변경한다. 기존 KOPIS/카카오 키와 웹 주소는 보존한다. `infra/supabase.env.example`은 서버 전용 설정 예시다.

| 변수 | 값 |
| --- | --- |
| SPRING_PROFILES_ACTIVE | supabase |
| DB_HOST | Connect에 표시된 Session pooler host |
| DB_PORT | 5432 |
| DB_NAME | postgres |
| DB_USERNAME | Connect의 user, 일반적으로 postgres.PROJECT_REF |
| DB_PASSWORD | 사용자가 설정한 DB 비밀번호 |

`render.yaml`도 외부 DB 설정으로 변경했지만 기존 Render 서비스에 자동 적용된다고 가정하지 않는다. Render DB 참조로 묶인 환경변수는 새 값으로 교체됐는지 확인한다. 기존 서비스 주소가 유지되므로 웹 API 프록시와 카카오 callback 도메인은 바꾸지 않는다. DB를 새로 만들었으므로 기존 로그인 세션은 복원되지 않고 재로그인이 필요하다.

## 배포 검증

1. 최신 main 소스의 API를 배포하고 활성 profile `supabase`, Flyway 실행 위치 `stagepin`, Hibernate 검증과 health `UP`을 확인한다.
2. 새 테이블이 `public`이 아닌 `stagepin`에 생성됐는지, 회원/세션/찜 테이블이 Data API에 노출되지 않는지 확인한다.
3. 공개 굿즈 목록은 빈 배열, 존재하지 않는 과거 굿즈 URL은 404가 정상이다. 카카오 로그인 후 새 글/사진/가격/상태를 저장하고 새로고침 후 유지되는지 확인한다. 실제 사용자 데이터 조작은 별도 동의 범위에서 수행한다.
4. 비로그인 auth/me, favorites, goods/mine은 401, 공개 공연 API는 기존 KOPIS 연동을 유지해야 한다. 빈 DB에 V2 데모 seed가 있어도 실제 홈 공연으로 표시하지 않는다.

`SupabaseConfigurationTest`는 profile/SSL/스키마/연결 한도 설정을 검사한다. `SupabaseSchemaDatabaseTest`는 GOODS_TEST_JDBC_URL의 **새 테스트 전용 DB**에서 전체 Flyway 실행, JPA 시작 검증, JDBC 검색 경로와 재실행 무변경을 확인한다. 실제 Supabase의 TLS/풀러/권한/외부 API 노출 검증을 대신하지 않는다.

2026-11-25 로컬 검증: 새 일회성 PostgreSQL 17에서 전체 서버 94개 중 93개 통과, 실제 모델 호출 1개 조건부 미실행. 인증 DB 7개, 굿즈 DB 4개, 찜 DB 3개, 새 스키마 DB 1개와 profile 설정 1개는 skip 없이 실행했다. 실제 Supabase 연결과 운영 배포는 로그인/프로젝트 설정 전이므로 미검증이다.

## 무료 한도와 사진

2026-11-25 공식 요금표 기준 Free DB 500MB, Storage 1GB, 일반 egress 월 5GB, cached egress 월 5GB, 활성 프로젝트 2개. 저활동 시 일시정지되며 관리형 자동 백업은 무료에 포함되지 않는다. 현재 사진은 BYTEA여서 **DB 500MB 한도**를 사용한다. Storage 이전과 자동 백업은 이번 변경에 포함하지 않는다. 계속 무료이거나 무중단인 운영을 보장하지 않는다.

공식 근거:

- [Spring Boot 연결과 전용 스키마](https://supabase.com/docs/guides/getting-started/quickstarts/spring-boot)
- [Session pooler, IPv4와 SSL](https://supabase.com/docs/guides/database/connecting-to-postgres)
- [Free 플랜 한도](https://supabase.com/pricing)
