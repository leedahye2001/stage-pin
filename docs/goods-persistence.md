# 굿즈 등록·사진 영속 저장

기준: 2026-11-05 구현. main 병합 및 운영 웹의 실제 카카오 계정 등록·재조회까지 검증했다. [배포 커밋·검증 결과](release-verification-2026-11-05.md)를 참고한다. iOS 실기기 검증은 별도다.

## 사용자 흐름

굿즈 → 등록 → 카카오 로그인 확인 → 사진·가격·상태 등 입력 → 서버 검증/저장 → 상세.
새로고침하거나 상세 URL로 직접 들어가도 서버에서 다시 조회한다. MY의 내 등록 굿즈는
로그인 회원 소유의 글만 조회한다. 비로그인은 목록·상세·공개 사진만 볼 수 있다.

- 글·사진은 공개 게시된다. 작성 전에 화면에 이를 안내한다. 연락처·주소를 적지 않도록 한다.
- 기존 샘플 8개와 메모리 등록 글은 서버 데이터로 자동 이관하지 않는다. 실제 목록에는 샘플을 섞지 않는다.
- 결제/채팅/구매·교환 신청은 아직 없다. 기존 목업 신청 버튼은 준비 중 상태로 바꿨다.
- 굿즈 하트는 메모리 상태다. 공연·아티스트 찜과 개인 일정의 저장 방식은 바꾸지 않았다.

## API와 인증

| API | 접근/동작 |
| --- | --- |
| GET `/api/v1/goods?page=0` | 공개 최신순, 페이지당 24개 |
| GET `/api/v1/goods/{id}` | 공개 상세, 목록 캐시와 독립 |
| GET `/api/v1/goods/photos/{id}` | 검증/재인코딩된 JPEG 응답 |
| GET `/api/v1/goods/mine?page=0` | 로그인 회원 소유 글만 조회 |
| POST `/api/v1/goods` | 로그인 필수, multipart `metadata` 문자열 + `photos` 반복 파일 |

작성자는 본문이 아닌 세션에서 가져온다. 공개 응답은 닉네임·회원 식별자만 포함하고 이메일/카카오 ID/토큰은 반환하지 않는다.
웹은 동일 출처 `/api/v1/goods/*` Vercel 프록시 + HttpOnly 쿠키, 네이티브는 SecureStore Bearer를 사용한다.
Cookie POST는 `STAGEPIN_WEB_URL`과 정확히 같은 Origin을 요구한다. 네이티브도 유효한 세션이 있어야 한다.
로컬 CORS는 인증 경로와 동일한 웹 origin만 credential을 허용한다.
일반 목록/상세/내 글은 `no-store`, 공개 사진은 1시간 캐시다.

## 저장·검증

- V8: `goods_listing.owner_id` → `member_account.id` 필수 FK, `goods_photo.listing_id` → `goods_listing.id` 필수 FK.
- 글/모든 사진 저장은 한 트랜잭션이다. 사진 저장 실패 시 글과 앞선 사진도 롤백한다.
- 클라이언트 요청 UUID와 회원 ID의 유일 제약으로 같은 등록의 재전송을 중복 저장하지 않는다.
- 판매 가격 1~100,000,000원 정수, 교환은 가격 null + 구하는 굿즈 필수.
- 상태: SEALED/OPENED_UNUSED/USED_GOOD/USED_FAIR/DAMAGED. 자유 문자열은 거부한다.
- 거래 방식 하나 이상, 현장이면 공연명 필수. 글자 수/필수값도 서버에서 검사한다.
- 사진 1~5장, 입력 장당 최대 10MB. MIME/확장자가 아니라 파일 내용으로 JPEG/PNG를 판별한다.
- 입력 최대 5천만 pixel, subsampling 후 긴 변 1600px 이하로 저장. 원본 EXIF/GPS/메타데이터는 보관하지 않는다.
- 저장 JPEG 장당 최대 2MB. 원본 파일은 보존하지 않는다. HEIC/WebP 등 미지원 입력은 안내와 함께 거부한다.
- iOS picker는 Compatible 표현을 요청한다. 실제 기기에서 지원되지 않는 형식은 JPEG/PNG로 선택해야 하며 자동 호환을 보장하지 않는다.
- 목록/상세는 사진 ID/URL/크기만 조회한다. 사진 BYTEA는 개별 이미지 요청에서만 읽는다.

## 소규모 저장 선택과 한계

추가 유료 계정/키 없이 재시작에도 유지되도록 PostgreSQL BYTEA에 저장했다.
Render의 임시 로컬 디스크는 쓰지 않는다. Compose는 기존 DB 볼륨을 보존한다.
이는 포트폴리오 소규모 단계이며 대량 사진 서비스에 적합한 최종 구조는 아니다.
DB 용량/백업·트래픽 부담이 증가하면 S3 계열 객체 저장소와 썸네일/CDN으로 이전한다.
배포 프록시의 업로드 한도도 별도 확인해야 한다. 설정상 앱 업로드 한도가 모든 호스팅 계층에서 보장되는 것은 아니다.
현재 수정/삭제, 거래 상태 전환, 신고/차단, 업로드 quota/시도 제한, 결제·채팅은 미구현이다.
운영 공개 전 이 제한과 개인정보처리방침·게시물 관리 절차를 검토한다.

## 검증

- 일반 단위 테스트: 가격/상태/방식/사진 수, 이미지 위조/재인코딩/크기, 작성자 세션 사용, 쿠키 Origin, 잘못된 토큰/만료, 공개 응답 이메일 미노출.
- 실제 DB 테스트: 격리된 새 PostgreSQL에서 새 Repository로 재조회, 사진 bytes/가격/상태 유지, 내 글 분리, 동일 요청 중복 방지, 사진 실패 롤백.
- `GOODS_TEST_JDBC_URL`이 `/stagepin_goods_test`로 끝나는 테스트 DB에서만 DB 테스트가 실행된다. 계정은 테스트 전용 `goods_test`다. 운영 DB를 지정하지 않는다.
- 실행: `backend/`에서 해당 환경 변수를 지정하고 `./gradlew test --no-daemon`. 새 빈 DB가 필요하며 테스트에서 V6/V7/V8 스키마를 초기화한다.
- 클라이언트: metadata 검증/서버 응답 매핑 테스트, lint, tsc, Node tests, 웹 export.
- iOS 실기기 사진 업로드·재빌드는 별도 검증 필요.

2026-11-05 최초 로컬 실행 결과: 서버 79개 중 75개 통과, 기존 인증 DB/실모델 조건부 4개 미실행.
새 굿즈 DB 테스트 4개는 실제 격리 PostgreSQL에서 실행했다. 클라이언트 Node 테스트 52개 통과.
별도 임시 API에 실제 multipart 업로드 후 해당 API를 재시작하고 글/가격/상태/사진 bytes가 유지되는 것까지 확인했다.
이 테스트는 합성 세션/전용 계정·DB를 사용했으며 실제 카카오 동의와 iPhone 업로드를 대체하지 않는다.

이후 인증·굿즈 테스트 DB를 함께 연결한 최종 검사에서는 서버 83개 중 82개 통과(외부 AI 실호출 1개 제외), 프런트 Node 테스트는 프록시 회귀 추가 후 55개 통과했다. 운영 웹에서 실제 카카오 세션의 사진/가격/상태 등록, 공개 조회, MY, 상세 재진입과 로그아웃·재로그인 후 유지까지 추가로 확인했다. 기술 선택과 한계는 [별도 기술 문서](auth-goods-technical-decisions.md)에 정리했다.

공식 참고: [Expo SDK 58 ImagePicker](https://docs.expo.dev/versions/v58.0.0/sdk/imagepicker/),
[Spring multipart](https://docs.spring.io/spring-framework/reference/web/webmvc/mvc-controller/ann-methods/multipart-forms.html).
