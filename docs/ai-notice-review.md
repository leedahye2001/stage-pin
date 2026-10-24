# AI 공연 공지 등록소

## 사용 흐름

MY → AI 공연 공지 분석 → 관리자 키 입력 → 공식 공지 URL과 텍스트 입력 → AI 분석
→ 원문 인용 확인·값 수정 → 검수 확인 → 승인 → 홈의 선예매·일반예매 목록 노출.

공연명, 아티스트, 공연장, 공연 기간, 팬클럽 인증 기간, 선예매·일반예매 일시,
예매처, 예매 URL을 추출한다. 공연장·공연 기간·인증 기간은 공지 기록에 보관한다.
홈에는 기존 ticket_opening 모델이 지원하는 선예매·일반예매 오픈 일정만 공개한다.

## 로컬 설정

`infra/.env`에 서버 전용 설정을 넣는다. 프론트의 EXPO_PUBLIC 환경 변수에는 넣지 않는다.

```dotenv
OPENAI_API_KEY=발급받은_API_키
OPENAI_MODEL=gpt-4o-mini
STAGEPIN_ADMIN_KEY=충분히_긴_임의의_관리자_키
```

```sh
docker compose -f infra/compose.yaml up -d --build api
cd mobile
EXPO_PUBLIC_API_URL=http://localhost:8080 npm run web -- --port 8081
```

기존 8081 개발 서버가 실행 중이면 먼저 그 서버를 종료한 후 다시 실행한다.
MY 화면의 관리자 키 입력란에는 STAGEPIN_ADMIN_KEY를 입력한다.
키는 화면 메모리에만 보관하며, 앱 저장소나 DB·로그에 보관하지 않는다.
API 키가 없으면 분석 요청은 503으로 명확하게 실패하며 가짜 AI 결과로 대체하지 않는다.

## 구현과 검증

- Spring AI 2.0.2 + OpenAI provider structured output + Java record schema.
- 프롬프트 버전 `ticket-notice-v1`; 원문은 명령이 아닌 데이터로 처리.
- 연도·시간 미상은 빈 문자열, 한국 공지의 시간대는 +09:00 사용.
- 각 값과 원문 인용문을 함께 저장하고, 서버에서 원문 포함 여부 검사.
- 원문 인용 일치는 사실의 정확도나 확률을 보장하지 않는다. 최종 공개는 관리자 검수 필요.
- 최초 AI 결과와 사람이 승인한 결과를 별도로 저장하여 변경 내역 비교 가능.
- 모델명·프롬프트 버전·응답 시간·총 토큰 수 저장.
- 관리자 인증을 모델 호출 전에 검사; 예외에 모델 응답 본문이나 키를 노출하지 않음.
- 모델 호출은 DB 트랜잭션 밖에서 수행.
- 승인 전체는 하나의 DB 트랜잭션이며 행 잠금으로 재승인 중복 생성 방지.
- 날짜·링크·예매처를 모두 검증한 후 공개. 일부 일정만 저장되는 것을 방지.
- 승인 후 React Query ticket-openings 캐시 무효화.

API:

| 요청 | 기능 |
| --- | --- |
| GET /api/v1/admin/notices | 최근 공지 30개 |
| POST /api/v1/admin/notices | sourceUrl, text 분석 및 초안 저장 |
| POST /api/v1/admin/notices/{id}/approve | 검수한 구조화 결과 승인 및 일정 공개 |

모든 요청에는 X-StagePin-Admin-Key 헤더가 필요하다.

## 평가

일반 테스트는 실제 API 호출 비용 없이 인증 순서, 원문 근거 거부, 초안 비공개,
승인 공개, 모호한 날짜 거부, 재승인 중복 방지를 검증한다.

실제 모델 평가 실행:

```sh
LIVE_AI_EVAL=true OPENAI_API_KEY=발급받은_API_키 ./gradlew test --tests '*NoticeExtractionLiveEvaluationTest' --info
```

20개 **합성 공지**로 예매처 4개, 선예매/일반예매, 오전/오후/정오,
연도 누락, 시간 미정을 평가한다. 실제 공식 공지를 수집한 데이터셋은 아니다.
실제 모델을 호출한 경우에만 `backend/build/reports/ai/notice-evaluation.csv`를 생성한다.
측정 항목: 선예매/일반예매 정확 일치 40개, 예매처 정확 일치 20개,
원문 근거 존재 20개, 응답 시간·토큰 수. 기준은 날짜 90%, 예매처 90%, 근거 100%.
이는 목표 기준이며 측정 성과가 아니다. 키가 없으면 live 테스트는 SKIPPED다.
실서비스 평가에는 사용 허용 범위를 확인한 실제 공지와 수작업 정답 데이터가 추가로 필요하다.

## 후속 작업

공개 배포 전 관리자 계정 기반 인증과 사용자별 호출 제한을 추가한다.
현재 MVP의 관리자 키는 전체 권한을 공유하므로 일반 사용자에게 배포하지 않는다.
스크린샷 OCR, URL 자동 수집, 자연어 검색, 벡터 DB는 이 MVP에 포함하지 않는다.
