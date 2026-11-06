# CI

- `ci.yml`의 backend/mobile job 이름은 branch protection 필수 검사와 연결될 수 있다. 이름·trigger 변경의 영향을 먼저 확인한다.
- 런타임 버전은 backend toolchain/mobile 의존성 요구와 맞추고 Gradle Wrapper·npm lockfile을 유지한다. 지침에 버전을 복제하기보다 workflow와 설정의 호환성을 확인한다.
- backend 테스트, mobile lint/tsc/Node 테스트/expo-doctor를 실패 무시·삭제·skip으로 우회하지 않는다.
- 일반 CI에 실제 AI 호출·운영 비밀키·배포 권한을 추가하지 않는다. 외부 API는 모의 응답으로 검사한다.
- 캐시 키/경로는 각 하위 프로젝트 lockfile에 맞춘다. 의존성 설치는 `npm ci`로 재현성을 유지한다.
- main 보호를 끄거나 강제 merge해 CI 오류를 해결하지 않는다. 원인을 수정한 뒤 해당 CI 재실행 결과를 확인한다.
