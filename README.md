# 🦉 English Study Hub v2.0

GPT-4o 기반 영어 학습 앱 — **API 키는 서버에서만 사용, 브라우저에 절대 노출 안 됨**

---

## 🔐 보안 구조

```
브라우저 (클라이언트)
    ↓  /api/chat 만 호출 (키 없음)
Vercel 서버 (pages/api/chat.js)
    ↓  OPENAI_API_KEY 환경변수 사용
OpenAI GPT-4o API
```

- `.env.local` → `.gitignore` 포함 → GitHub에 절대 올라가지 않음
- Vercel 환경변수는 암호화 저장, 서버에서만 주입됨
- 클라이언트 코드에는 API 키 흔적 없음

---

## 🚀 배포 3단계

### 1. 로컬 테스트

```bash
npm install
cp .env.local.example .env.local
# .env.local 파일 열어서 OPENAI_API_KEY= 뒤에 본인 키 입력
npm run dev
# → http://localhost:3000
```

### 2. GitHub 업로드

```bash
git init
git add .
git commit -m "English Study Hub v2.0"

# GitHub 새 저장소 만들고:
git remote add origin https://github.com/본인아이디/english-study-hub.git
git push -u origin main
```

> ✅ `.env.local`은 `.gitignore`에 있어서 자동으로 제외됩니다

### 3. Vercel 배포

1. [vercel.com](https://vercel.com) 접속 → GitHub 계정 로그인
2. **"Add New Project"** → GitHub 저장소 선택
3. **"Environment Variables"** 섹션에서 추가:
   - `OPENAI_API_KEY` = `sk-본인키입력`
   - `NEXT_PUBLIC_ADMIN_PIN` = `원하는PIN숫자` *(선택, 기본값: 1234)*
4. **"Deploy"** 클릭 → 완료!

---

## 📁 파일 구조

```
├── pages/
│   ├── api/
│   │   └── chat.js     ← OpenAI 호출 (서버 전용, API 키 여기만 사용)
│   └── index.js        ← 앱 전체 UI
├── package.json
├── .gitignore           ← .env.local 포함 (GitHub 제외)
├── .env.local.example  ← 환경변수 예시
└── README.md
```

## ✨ 기능

| 탭 | 기능 |
|---|---|
| 📋 오늘 정리 | 구글독스 붙여넣기 → GPT-4o 분석 → **8개 카테고리 자동 분류 저장** |
| ✍️ 문장 평가 | 10점 채점 + 수정 + 고급 표현 제안 / 단어 완전 분석 |
| 🎯 선택 모드 | 관리자 PIN → 다이얼 애니메이션으로 단어 출제 |
| 📂 보관함 | 8카테고리 탭 + 단어장 (자동 분류 항목 열람/삭제) |
| 🔁 복습 | 전체기록 / 문장평가 / 단어검색 기록 열람 + AI 퀴즈 |
