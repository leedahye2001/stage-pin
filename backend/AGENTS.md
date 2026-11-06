# Backend 변경 제약

- 기능별 패키지를 전역 controller/service 구조로 재편하지 않는다. 공개 DTO 경계를 유지해 엔티티 내부 필드가 API에 노출되지 않게 한다.
- `/api/v1` 계약과 `common/error/ApiErrorHandler` 오류 형식을 유지한다. 실패를 성공한 빈 결과로 바꿔 원인을 숨기지 않는다.
- 읽기/쓰기 트랜잭션을 구분한다. 네트워크/모델 호출 때문에 DB 트랜잭션·잠금을 오래 유지하지 않는다.
- 외부 Client의 시간 제한·캐시·실패 처리를 보존한다. API 키가 포함된 요청 URL이나 원문 응답을 로그로 흘리지 않는다.
- 시간은 기존 `Instant`/명시적 offset 계약을 유지하고 한국 일정은 `Asia/Seoul`로 해석한다. 공연일과 예매 오픈일을 혼동하지 않는다.
- DB 변경은 `src/main/resources/AGENTS.md`, 테스트 실행·변경은 `src/test/AGENTS.md`의 격리 DB/조건부 테스트 지침도 확인한다.

## 검증 (`backend/`에서)

- 기본: `./gradlew test --no-daemon`. Java toolchain 버전은 `build.gradle`을 기준으로 한다.
- 로컬 JDK가 없으면 설치를 강제하지 않고 Docker를 확인한다. 현재 toolchain용 대안:
  `docker run --rm -v "$PWD":/workspace -v stagepin-gradle-cache:/root/.gradle -w /workspace eclipse-temurin:21-jdk-alpine ./gradlew test --no-daemon`
- API 변경은 정상 응답 외에도 잘못된 입력·인증 실패·외부 연동 실패를 회귀 테스트한다.
