# 인프라 변경 제약

- ignored `.env`는 `.env.example`을 기준으로 설정한다. Compose 설정 검증 출력에도 비밀값이 포함될 수 있으므로 그대로 출력하지 않는다.
- DB healthcheck와 API의 `depends_on`을 유지한다. 내부 DB 호스트 `database`와 Mac 모델 접근 `host.docker.internal`을 혼동하지 않는다.
- PostgreSQL 데이터 볼륨은 사용자 데이터다. `down -v`·볼륨 삭제·DB 초기화를 일반 오류 해결 단계로 수행하지 않는다.
- 환경 변수 변경은 backend 설정·`.env.example`·배포 설정의 차이를 확인한다.
- Ollama 포트를 인터넷에 공개하거나 인증 없는 터널을 만들지 않는다. 운영 서버에서 Mac 로컬 모델이 자동 연결된다고 가정하지 않는다.
- 운영 배포는 루트 `render.yaml`, `mobile/vercel.json`뿐 아니라 서비스의 실제 소스 커밋·Git 연결·자동 배포 설정을 확인한다. main 병합이나 로컬 Docker 실행을 운영 반영으로 간주하지 않는다.
- 배포 후 health/API/화면을 각각 확인한다. 수동 배포·검증 사례는 `docs/release-verification-2026-11-05.md`를 참고하되 당시 설정을 현재 상태로 단정하지 않는다.
