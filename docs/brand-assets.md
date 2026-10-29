# 로고 자산

- 화면·시작 화면: `mobile/assets/stagepin-pin.png` (기존 투명 핀 재사용, 512×512 RGBA). 새 파일명으로 이전 아이콘 캐시와 구분한다.
- 앱 아이콘: `mobile/assets/stagepin-icon.png` (흰 배경, 1024×1024, 불투명).
- 브라우저 아이콘: `mobile/assets/stagepin-favicon.png` (흰 배경, 64×64).
- Android adaptive icon 배경: `#FFFFFF`, 전경: 투명 핀.

흰 배경 아이콘은 내장 imagegen 편집으로 생성했다. 프롬프트: 기존 StagePin 아이콘의 검정 배경과 핀 안쪽 어두운 배경만 흰색으로 교체하고, 보라색 핀·무대·교차하는 두 조명과 중앙 배치를 유지한다. 글자·새 요소·어두운 타일은 추가하지 않는다.

설치된 iOS/Android 앱의 런처 아이콘은 네이티브 재빌드 및 재설치 후 반영된다. 웹 핀 이미지는 개발 서버에서 즉시 확인할 수 있다.
