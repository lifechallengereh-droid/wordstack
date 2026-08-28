# WordStack GitHub Pages 배포 안내 (Jekyll 미사용)

이 버전은 순수 HTML/CSS/JavaScript PWA이므로 Jekyll 빌드가 필요하지 않습니다.

## 최초 1회 설정
1. GitHub 저장소에서 **Settings → Pages**로 이동합니다.
2. **Build and deployment → Source**를 **GitHub Actions**로 변경합니다.
3. 저장소 루트에 이 패키지의 파일 전체를 업로드/교체하고 Commit 합니다.
4. **Actions** 탭에서 `Deploy WordStack to GitHub Pages` 작업이 실행되는지 확인합니다.
5. 작업이 완료되면 Pages 주소를 열어 WordStack을 확인합니다.

## 이 패키지가 기존 오류를 피하는 방식
- 루트의 `.nojekyll` 파일로 Jekyll 처리를 비활성화합니다.
- `.github/workflows/deploy-pages.yml`은 별도의 사이트 빌드 없이 정적 파일을 그대로 Pages artifact로 업로드합니다.
- 따라서 `ghcr.io/actions/jekyll-build-pages` Docker 이미지를 Pull하는 단계가 없습니다.

## 주의
- Settings → Pages의 Source가 계속 `Deploy from a branch`라면 GitHub가 기존 Pages/Jekyll 경로를 사용할 수 있습니다.
- 이 패키지에서는 **Source = GitHub Actions** 사용을 권장합니다.
- 이전 `pages-build-deployment` 실패 이력은 Actions 기록에 남아 있어도 새 배포에는 영향이 없습니다.
