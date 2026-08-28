# WordStack GitHub Pages 워크플로 수정

오류: `No event triggers defined in on`

1. GitHub 저장소에서 `.github/workflows/deploy-pages.yml`을 삭제하거나 Edit로 엽니다.
2. 이 패키지의 `.github/workflows/deploy-pages.yml`로 완전히 교체합니다.
3. Commit changes 합니다.
4. Settings > Pages > Build and deployment > Source가 `GitHub Actions`인지 확인합니다.
5. Actions에서 `Deploy WordStack to GitHub Pages`가 실행되는지 확인합니다.

정상 단계:
- Checkout repository
- Configure GitHub Pages
- Upload WordStack static files
- Deploy to GitHub Pages

이 워크플로는 Jekyll을 사용하지 않습니다.
