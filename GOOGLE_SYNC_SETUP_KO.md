# WordStack v7.2 · Google 동기화 설정

WordStack은 Google Drive의 **플래시카드_단어장_양식_v6 → Flashcards** 탭과 직접 양방향 동기화하도록 연결되어 있습니다.

## 최초 1회 설정

1. Google Cloud Console에서 프로젝트를 만들거나 기존 프로젝트를 선택합니다.
2. **Google Sheets API**를 활성화합니다.
3. Google Auth Platform/OAuth 동의 화면을 설정합니다. 테스트 단계라면 사용하는 Google 계정을 Test user로 추가합니다.
4. OAuth Client에서 **Web application** 유형의 Client ID를 생성합니다.
5. **Authorized JavaScript origins**에 WordStack을 실제로 호스팅한 주소의 origin을 입력합니다.
   - 예: `https://사용자명.github.io`
   - 저장소 경로(`/wordstack/`)는 넣지 않고 origin까지만 입력합니다.
6. 발급된 `...apps.googleusercontent.com` 형식의 Client ID를 WordStack의 **설정 → Google 스프레드시트 연동 → Google OAuth Client ID**에 입력합니다.
7. **구글동기화**를 누르고 Google 계정과 권한을 승인합니다.

## 동기화 동작

- Google 시트에서 새 단어를 입력하거나 기존 내용을 수정한 뒤 WordStack의 **구글동기화**를 누르면 앱에 반영됩니다.
- WordStack에서 카드를 새로 만들거나 수정하면 `동기화 대기` 상태가 됩니다. 현재 Google 권한이 살아 있으면 자동 동기화되고, 그렇지 않으면 다음 **구글동기화** 때 시트에 반영됩니다.
- WordStack에서 삭제한 카드나 단어장은 다음 동기화 때 Google 시트에서도 삭제됩니다.
- 동일 카드 판별 기본키는 **영어단어 + Category + Chapter** 조합입니다.
- 양쪽에서 동시에 같은 카드를 수정한 경우, 앱에서 아직 동기화되지 않은 수정(`동기화 대기`)이 있으면 앱 내용이 우선됩니다. 그렇지 않으면 Google 시트 내용이 앱으로 들어옵니다.

## 동기화되는 열

`EnglishWord | IPA | EnglishExample | KoreanMeaning | KoreanExample | Category | Chapter | Tags`

머리글 이름과 순서를 변경하지 않는 것을 권장합니다.

## 보안

- Client Secret은 WordStack에 입력하지 않습니다.
- OAuth Client ID만 브라우저 설정(localStorage)에 저장합니다.
- Google Access Token은 메모리에만 유지하며 파일이나 백업에 저장하지 않습니다.
- Access Token이 만료되면 **구글동기화** 버튼을 다시 눌러 권한을 갱신합니다.

## 주의

연결 대상은 Google Drive에 있는 **Google 스프레드시트 버전**입니다. PC에 별도로 다운로드한 `.xlsx` 사본을 오프라인 Excel에서 수정하는 것만으로는 앱과 자동 동기화되지 않습니다. Google Drive의 해당 스프레드시트를 Google Sheets 웹/앱에서 편집해야 합니다.


## v7.2.3 Google Sheet URL 선택
설정 > Google 동기화에서 Google Sheet URL을 직접 입력할 수 있습니다. URL 예: https://docs.google.com/spreadsheets/d/<ID>/edit . WordStack은 URL에서 ID를 자동 추출하며 Flashcards 탭을 사용합니다. 새 시트로 바꾸면 첫 행은 EnglishWord, PartOfSpeech, IPA, EnglishExample, KoreanMeaning, KoreanExample, Category, Chapter, Tags 순서를 유지하세요.
