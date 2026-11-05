# Backend

- Java 버전과 의존성은 `build.gradle`, 빌드 도구는 Gradle Wrapper를 기준으로 한다. 현재 Java 21, Spring Boot 4, Spring AI 2 계열이다.
- `src/main/java/com/leedahye/stagepin` 아래의 기능별 패키지 구조를 유지한다. 전역 controller/service 폴더로 재편하지 않는다.
- 컨트롤러는 HTTP/입력 검증, 서비스는 업무 흐름, Repository는 저장 접근을 담당한다. 외부 연동은 기존 Client 경계에 둔다.
- 생성자 주입, 기존 record DTO·enum을 활용한다. 엔티티를 그대로 공개 응답으로 반환하지 않는다.
- `/api/v1` 계약, `common/error/ApiErrorHandler`의 오류 형식을 유지한다. 실패를 성공한 빈 결과로 바꿔 원인을 숨기지 않는다.
- 읽기 트랜잭션과 쓰기 트랜잭션을 구분한다. 네트워크/모델 호출 때문에 DB 트랜잭션·잠금을 오래 유지하지 않는다.
- 외부 요청에는 시간 제한·캐시·실패 동작을 고려한다. API 키가 포함된 요청 URL이나 원문 응답을 로그로 흘리지 않는다.
- 시간은 기존 `Instant`/명시적 offset 계약을 유지하고, 한국 일정 해석은 `Asia/Seoul`을 기준으로 한다. 공연일과 예매 오픈일을 혼동하지 않는다.
- DB 변경은 `src/main/resources/AGENTS.md`, 테스트 변경은 `src/test/AGENTS.md`를 확인한다. 도메인 변경은 해당 패키지 지침도 읽는다.

## 검증 (backend에서)
- `./gradlew test --no-daemon`
- 로컬 JDK 21이 없으면 설치를 강제하지 않고 Docker 사용 가능 여부를 확인한다:
  `docker run --rm -v "$PWD":/workspace -v stagepin-gradle-cache:/root/.gradle -w /workspace eclipse-temurin:21-jdk-alpine ./gradlew test --no-daemon`
- API 변경 시 정상 응답 외에도 잘못된 입력·인증 실패·외부 연동 실패의 회귀 테스트를 추가한다.
