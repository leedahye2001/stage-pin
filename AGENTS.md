# StagePin 작업 지침

## 적용 범위
- 이 파일은 저장소 전체의 공통 규칙이다. 작업할 경로의 하위 `AGENTS.md`도 먼저 읽고, 더 구체적인 지침을 함께 따른다.
- 루트에서 시작한 세션은 하위 지침이 모두 자동 로드된다고 가정하지 않는다. 아래 경로 안내를 따라 관련 파일을 직접 확인한다.
- `config.toml`의 모델·권한·개인 설정은 이 문서의 관리 대상이 아니다.

## 구조와 지침 위치
- `backend/`: Java/Spring 공통. 도메인별 추가 지침은 `src/main/java/com/leedahye/stagepin/{concert,artist,auth,ticketing}/`에 있다.
- `backend/src/main/resources/`: 설정·Flyway. `backend/src/test/`: 서버 테스트.
- `mobile/`: Expo 공통. `src/app/`, `src/components/`, `src/api/`, `src/lib/`, `src/theme/`, `assets/`, `tests/`에 세부 지침이 있다.
- `infra/`: 로컬 Docker. `.github/workflows/`: CI. `docs/`: 구현 문서.
- 의존성·빌드 산출물(`node_modules`, `build`, `dist`, `.expo`)에는 지침을 복제하지 않는다.

## 제품·데이터 경계
- 핵심은 공연·예매 일정 탐색과 팬 굿즈 판매/교환, 현장 교환이다. 숨겨진 로그북·모의 티켓팅을 요청 없이 핵심 메뉴로 되살리지 않는다.
- 공연/예매 일정, 찜, 내 일정은 다른 개념이다. 찜만 했다고 관람 확정이나 예매 완료로 처리하지 않는다.
- 굿즈는 현재 메모리 기반 목업이다. 실제 등록·거래·결제·채팅·위치 공유가 구현됐다고 표시하거나 설명하지 않는다.
- 외부 응답의 누락을 임의의 가수명·예매 시각·공연장 좌표·예매 링크로 채우지 않는다. 출처별 데이터와 검증 상태를 유지한다.
- 코드가 현재 구현의 기준이다. 오래된 README/설계 문서와 다르면 코드를 확인하고 해당 문서를 수정한다.

## 변경·검증·Git
- 기존 도메인/컴포넌트/유틸리티를 먼저 활용하고, 요청과 무관한 재구조화·패키지명 변경·의존성 추가는 피한다.
- 기존 사용자 변경을 보존한다. API 계약 변경은 Java 응답과 TypeScript 타입, 소비 화면·테스트를 함께 확인한다.
- 기능 단위로 검증하고 의미 있는 커밋 메시지를 남긴다. 커밋에는 해당 작업 파일만 포함한다.
- feature/fix 브랜치 → PR → backend/mobile CI 통과 → main 병합 흐름을 유지한다. 직접 main 푸시, 강제 푸시, 보호 규칙 우회는 하지 않는다.
- 푸시·병합·운영 배포는 해당 요청이 있을 때만 수행한다. 배포 시 커밋·환경 변수·프론트/백엔드 반영 여부를 각각 확인한다.
- 비밀키, 토큰, 개인정보, `.env` 내용은 출력·커밋하지 않는다. `EXPO_PUBLIC_*` 값은 공개됨을 전제로 한다.
- 코드 변경은 각 영역의 검사 명령을 실행한다. 문서만 바뀌면 경로·명령·내용과 `git diff --check`를 확인하고, 실행하지 않은 검사는 명시한다.

## 근거
- [공식 Config Basics](https://learn.chatgpt.com/docs/config-file/config-basic)
- [공식 AGENTS.md 탐색·우선순위](https://learn.chatgpt.com/docs/agent-configuration/agents-md)
