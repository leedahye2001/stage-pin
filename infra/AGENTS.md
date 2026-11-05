# 로컬 인프라

- `compose.yaml`은 API + PostgreSQL 개발 환경이다. 운영 배포와 로컬 컨테이너 실행을 같은 것으로 설명하지 않는다.
- 이 폴더에서 `.env.example`을 참고해 ignored `.env`를 사용한다. 실제 값은 읽어 출력하거나 커밋하지 않는다.
- 실행: `docker compose up --build`; 상태: `docker compose ps`; API 상태: `http://localhost:8080/actuator/health`.
- DB healthcheck와 API의 `depends_on`을 유지한다. 내부 DB 호스트는 `database`, Mac의 모델 접근은 기존 `host.docker.internal` 경계를 따른다.
- PostgreSQL 데이터 볼륨은 사용자 데이터다. `down -v`·볼륨 삭제·DB 초기화를 일반적인 오류 해결 단계로 수행하지 않는다.
- 환경 변수 변경은 backend 설정·`.env.example`·배포 설정의 차이를 확인한다. Compose 설정 검증 결과에 비밀값이 포함될 수 있으므로 그대로 출력하지 않는다.
- Ollama 포트를 인터넷에 공개하거나 인증 없는 터널을 만들지 않는다. 운영 서버에서 Mac의 로컬 모델이 자동 연결된다고 가정하지 않는다.
- 운영 배포 요청 시 루트 `render.yaml`, `mobile/vercel.json`과 해당 서비스의 실제 설정을 확인하고 health/API/화면을 따로 검증한다.
