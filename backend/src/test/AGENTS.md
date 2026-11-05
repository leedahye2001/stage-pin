# Backend 테스트

- main 소스와 같은 도메인 패키지에 `*Test.java`를 둔다. JUnit 5, AssertJ, Mockito, MockMvc, MockRestServiceServer 등 기존 테스트 도구를 우선한다.
- 일반 테스트는 실제 KOPIS·카카오·이미지 서비스·모델이나 유료 API를 호출하지 않는다. 고정 fixture와 모의 HTTP 응답으로 성공·누락·실패를 재현한다.
- 날짜 로직은 고정된 시각/명시적 offset을 사용한다. 외부 응답 fixture에는 실사용 키·토큰·개인 프로필을 넣지 않는다.
- 응답 내용뿐 아니라 HTTP 상태, 외부 요청 전 입력 검증, 오류 후 재시도, 중복 승인/로그인 코드 재사용 방지를 확인한다.
- DB 전용 테스트와 `LIVE_AI_EVAL` 조건부 테스트가 skip되면 통과로 포장하지 말고 실행 조건과 미검증 범위를 보고한다.
- 실행: `backend/`에서 `./gradlew test --no-daemon`. 단일 테스트는 `./gradlew test --tests '전체.패키지.TestClass' --no-daemon`.
- 테스트를 통과시키려고 보안 검사·좌표 검증·실패 상태를 완화하지 않는다.
