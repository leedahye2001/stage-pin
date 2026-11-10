# Backend 테스트 제약

- 일반 테스트는 실제 KOPIS·카카오·이미지 서비스·모델이나 유료 API를 호출하지 않는다. 고정 fixture와 모의 HTTP 응답으로 성공·누락·실패를 재현한다.
- 날짜는 고정 시각/명시적 offset으로 검사한다. fixture에 실사용 키·토큰·개인 프로필을 넣지 않는다.
- HTTP 상태, 외부 요청 전 입력 검증, 오류 후 재시도, 중복 승인/로그인 코드 재사용 방지를 확인한다. 보안 검사·좌표 검증·실패 상태를 완화해 테스트를 통과시키지 않는다.
- DB 테스트는 새 격리 DB만 사용한다. `AUTH_TEST_JDBC_URL`은 `/stagepin_auth_test`, `GOODS_TEST_JDBC_URL`은 `/stagepin_goods_test`로 끝나야 하며 각 fixture의 전용 계정을 사용한다. 운영/개발 사용자 DB에 테스트 스키마를 초기화하지 않는다.
- DB 환경 변수를 설정·변경한 뒤에는 `backend/`에서 `./gradlew test --rerun-tasks --no-daemon`으로 실행한다. 환경 변수만 바꾸면 Gradle이 `UP-TO-DATE`로 끝날 수 있다. XML 보고서에서 인증/굿즈 DB 테스트가 실제 실행되고 skip되지 않았는지 확인한다.
- DB 전용 테스트와 `LIVE_AI_EVAL` 조건부 테스트가 skip되면 통과로 포장하지 말고 실행 조건과 미검증 범위를 보고한다.
