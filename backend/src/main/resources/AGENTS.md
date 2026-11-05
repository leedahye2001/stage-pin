# 설정·마이그레이션

- 비밀값은 환경 변수 참조로만 설정한다. `.env.example`에는 설명용 placeholder만 넣는다.
- `application.yml`, `infra/compose.yaml`, 루트 `render.yaml`의 관련 환경 변수 이름과 기본값을 함께 확인한다. 설정 파일이 있다고 운영에 설정된 것으로 간주하지 않는다.
- Hibernate `ddl-auto: validate`, Flyway 관리 방식을 유지한다. `update`로 스키마 변경을 우회하지 않는다.
- `db/migration/`의 적용된 `V*__*.sql`은 수정하지 않는다. 기존 번호 다음의 새 버전으로 변경하고 이미 사용한 번호를 재사용하지 않는다.
- 컬럼·enum·제약 조건 변경은 Java 엔티티/DTO·기존 데이터 호환성·테스트를 함께 검토한다. 파괴적 변경은 데이터 보존/이행 방안을 먼저 확인한다.
- 데모 seed를 실제 공연·예매 데이터로 오인하게 만들지 않는다. 운영 키·개인정보를 seed에 넣지 않는다.
- 스키마 변경 시 `docs/erd.md`를 갱신하고, 실제 FK와 단순 UUID 참조를 구분한다.
