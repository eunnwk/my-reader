# My Reader

텍스트 파일(.txt)을 읽고 하이라이트를 저장하며 트위터로 공유할 수 있는 심플한 웹 리더입니다.

## 특징

- 외부 의존성 없음 (npm, 빌드 도구 불필요)
- 브라우저에서 바로 실행
- 다크 테마
- 텍스트 하이라이트 저장
- 트위터 공유 기능
- 모든 데이터는 localStorage에 저장 (서버 전송 없음)

## 실행 방법

```bash
# 방법 1: 직접 열기
xdg-open index.html   # Linux
open index.html       # macOS

# 방법 2: 로컬 서버로 실행
python3 -m http.server 8000
# http://localhost:8000 접속
```

## 사용 방법

1. `.txt` 파일 업로드
2. 텍스트를 드래그해서 선택
3. 하이라이트 저장
4. 원하는 하이라이트를 트위터로 공유

## 파일 구조

```
index.html   # 메인 HTML
app.js       # 앱 로직
style.css    # 스타일
```

## 라이선스

MIT
