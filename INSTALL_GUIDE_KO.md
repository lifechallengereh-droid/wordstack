# WordStack v6 설치 및 업데이트

## GitHub Pages에 처음 설치
1. GitHub에서 Public 저장소를 만듭니다.
2. v6 ZIP 압축을 풀고 `index.html`, `app.js`, `styles.css`, `manifest.webmanifest`, `sw.js`, `icons` 폴더를 저장소 루트에 업로드합니다.
3. Settings → Pages → Deploy from a branch → `main` / `(root)`를 선택합니다.
4. 생성된 `https://사용자명.github.io/저장소명/` 주소를 Android Chrome에서 엽니다.
5. Chrome 메뉴에서 앱 설치 또는 홈 화면에 추가를 선택합니다.

## v5에서 v6로 업데이트
기존 저장소에서 `index.html`, `app.js`, `styles.css`, `manifest.webmanifest`, `sw.js`를 v6 파일로 교체하고 커밋하면 됩니다. v6는 기존 v5 카드의 Front/Back/Example을 EnglishWord/KoreanMeaning/EnglishExample 필드로 자동 변환합니다.

## v6 Excel 열
`EnglishWord | IPA | EnglishExample | KoreanMeaning | KoreanExample | Category | Chapter | Tags`

## 중요한 데이터 안내
- 전체 단어DB는 카드 관리 또는 설정 → `전체 단어DB 엑셀 다운로드`에서 `.xlsx`로 받을 수 있습니다.
- 전체 학습 기록까지 보관하려면 설정 → `전체 데이터 백업`의 JSON도 함께 보관하세요.
- 학습시간 및 월별 복습 상세 통계는 v6부터 기록됩니다.
