# 아티스트 프로필 데이터 이용 검토

검토일: 2026-10-28. 법률 의견이나 모든 이용 상황에 대한 적법성 보장이 아닌 구현 기준.

## 채택한 API

- 사진 조회는 Wikidata + Wikimedia Commons 경로만 사용한다. Spotify 연동·컨테이너 인증정보 전달은 제거했으며, 로컬 `.env`에 기존 Spotify 키가 남아 있어도 호출하지 않는다. 사진 API 키나 유료 구독은 필요하지 않다.

- MusicBrainz artist search: 이름, MBID, 별칭, 지역, 동명이인 구분 등 core data만 사용.
  Core data는 CC0. 사용자 태그·평점·annotations 등 supplementary data는 별도 NC 라이선스이므로 가져오지 않음.
  https://musicbrainz.org/doc/About/Data_License
  https://musicbrainz.org/doc/MusicBrainz_Database
- **데이터 라이선스와 호스팅 API 이용 조건은 다르다.** MusicBrainz 웹 서비스는 비상업 사용에 무료이며 상업 사용은 commercial plans 또는 문의를 안내한다. 현재 연결은 결제·실거래 없는 로컬 포트폴리오/비상업 목업 기준이다. 실제 굿즈 판매 서비스, 광고·수수료 등 상업 운영 전 API 계약/요금 조건 확인 또는 허용되는 자체 CC0 카탈로그/다른 제공자로 전환해야 한다. CC0라는 이유만으로 상업 API 사용까지 무조건 무료라고 안내하지 않는다.
  https://musicbrainz.org/doc/MusicBrainz_API
  https://metabrainz.org/supporters/account-type
- Wikidata Query Service: MusicBrainz ID(P434)와 이미지(P18) 연결. 구조화 데이터는 CC0지만, P18이 가리키는 사진의 라이선스까지 CC0인 것은 아님.
  https://www.wikidata.org/wiki/Wikidata:Data_access
- Wikimedia Commons imageinfo/extmetadata: 이미지 URL, 작성자/맞춤 출처 표기, 파일 페이지, 라이선스를 확인.
  https://www.mediawiki.org/wiki/Extension:CommonsMetadata

## 표시 정책

- CC BY / CC BY-SA 2.0, 3.0, 4.0 및 CC0는 이름과 Creative Commons 라이선스 URL이 일치해야 함. Public domain은 Commons 메타데이터가 `License=pd`, `Copyrighted=False`로 함께 확인되고 작성자/출처가 있는 경우 허용하며, CC0로 바꾸어 표시하지 않음.
- BY/SA 사진은 작성자/맞춤 Attribution, Commons 원본 페이지와 라이선스 정보가 없으면 표시하지 않음.
- 삭제 검토 표시가 있는 파일, 출처가 불명확한 사진, NC·ND·독점/기타 라이선스는 기본 이미지로 대체.
- 실제 공식 프로필 사진/최신 사진을 보장하지 않음. 설명은 '아티스트 사진'으로 표시하며 제휴·공식 인증으로 표현하지 않음.
- 사진 옆 출처 표시에서 작성자·라이선스·파일 제목/원본 페이지로 접근 가능. 정사각 프로필을 채우도록 원본 비율을 유지한 채 중앙 크롭하며 변경 사실을 출처 창에 표시함. 필터·배너 광고 등에 전용하지 않음.
- 사진 크레딧과 라이선스는 홈 추천, 검색, 아티스트 상세와 MY에서 확인 가능.
- 자유 라이선스는 초상권·퍼블리시티권·상표권까지 보증하지 않음. 상품 판매 사진이나 광고 소재에 전용하지 않으며 공개 상용 서비스 전 사용 맥락 검토 필요.
  https://commons.wikimedia.org/wiki/Commons:Reusing_content_outside_Wikimedia
  https://foundation.wikimedia.org/wiki/Legal:Wikimedia_Developer_App_Guidelines
  https://creativecommons.org/licenses/by-sa/4.0/

## 범위·실패 처리

- 세계 모든 가수의 사진을 일괄 수집하지 않는다. 검색 API가 반환하는 가수와 추천 아티스트를 요청 시 조회.
- 동명이인·잘못된 메타데이터·누락 가능. 사진이 없거나 외부 API가 실패하면 기본 아이콘과 재시도 안내.
- MB 호출 제한을 준수하고 서버 캐시 사용. 사용자 검색어가 외부 카탈로그에 전송되며 비공개 정보 입력을 요구하지 않음.
- 선예매·일반예매 정보는 이 API의 제공 범위가 아니다. 홈은 찜한 가수와 일치하는 검수된 예매 일정만 표시하고, 없을 때 빈 상태를 표시한다.
- 굿즈 목업의 아티스트 이름과 실시간 카탈로그·예매 일정 출처를 혼동하지 않도록 화면 문구를 구분.
