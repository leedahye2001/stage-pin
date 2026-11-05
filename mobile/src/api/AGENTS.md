# HTTP 계약

- 공연·아티스트·예매 일정 타입/요청은 `concerts.ts`, 인증은 `auth.ts`의 기존 경계에 둔다. 화면에서 같은 endpoint와 타입을 복제하지 않는다.
- 응답 타입 변경은 backend DTO와 사용처를 함께 확인한다. HTTP 오류를 무조건 빈 배열/null로 바꿔 데이터 없음과 서버 장애를 합치지 않는다.
- `EXPO_PUBLIC_API_URL`은 공개 백엔드 주소다. 네이티브 실기기의 localhost는 Mac이 아님을 고려하고 플랫폼별 기본값을 보존한다.
- KOPIS·카카오 REST·관리자·모델의 비밀키는 클라이언트 환경 변수에 넣지 않는다. 공개 지도 JS 키와 서버 비밀키를 구분한다.
- 웹 인증은 same-origin proxy/쿠키, 네이티브 토큰은 SecureStore를 사용한다. 웹 localStorage에 세션 토큰을 저장하지 않는다.
- PKCE verifier의 단기 저장·소비/삭제와 네이티브 중복 callback 교환 방지를 유지한다.
- source ID·nullable 메타데이터·좌표 미확인 값을 보존한다. 서버 누락값을 클라이언트에서 실제 사실처럼 채우지 않는다.
