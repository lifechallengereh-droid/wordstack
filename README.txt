WordStack v6

주요 기능
- Excel 가져오기 및 전체 단어DB Excel 다운로드
- 영어단어 / IPA / 영어예문 / 한글의미 / 한글예문 / Category / Chapter / Tags 분리 저장
- 카드 앞면·뒷면 표시 필드 사용자 선택 및 한글앞면/영어앞면 프리셋
- 간격반복 학습, 취약단어 자동 판정 및 최근 5회 중 4회 정답 시 자동 졸업
- 20문제 객관식·주관식 자동 퀴즈, 점수 및 오답해설
- 단어·예문 TTS, 미국/영국/호주 영어 및 0.7x/1.0x/1.2x 속도
- 단어장 색상·아이콘·이름 관리, Chapter 하위 구조
- Chapter 길게 누르기 → 순서 변경, 자연 정렬(1강→2강→3강)
- Chapter별 학습률 / 퀴즈 평균점수 / 취약단어 수
- 연도별 1~12월 학습시간(min), 학습일수, 복습, 퀴즈 평균점수 그래프
- 연간 학습일수 / 365 및 비율 표시
- JSON 전체 백업/복원

참고
- 학습시간과 월별 복습 이력 그래프는 v6부터 날짜별로 누적됩니다. v5 이전 버전에는 해당 세부 타임스탬프가 없어 과거 월별 그래프로 복원할 수 없습니다.
- GitHub Pages 같은 HTTPS 환경에서 PWA 설치가 가장 안정적입니다.

[WordStack v7.2 Google Sync]
- 연결 대상: Google 스프레드시트 '플래시카드_단어장_양식_v6'의 Flashcards 탭
- 앱 카드 추가/수정: Google 동기화 대기로 표시되며, 현재 세션에 Google 권한이 있으면 자동 업로드합니다.
- Google 시트 추가/수정: 앱에서 '구글동기화'를 누르면 앱으로 가져옵니다.
- 앱에서 삭제한 카드/단어장은 다음 Google 동기화 때 시트에서도 삭제됩니다.
- 동기화 열: EnglishWord, IPA, EnglishExample, KoreanMeaning, KoreanExample, Category, Chapter, Tags
- 학습 이력/퀴즈 이력/간격반복 상태는 Google 시트로 보내지 않으며 앱의 로컬 데이터/JSON 백업에 유지됩니다.
- 최초 1회 Google Cloud에서 Web application OAuth Client ID 생성 및 Google Sheets API 활성화가 필요합니다.
