// api/evaluate.js 내부의 prompt 부분 수정
const prompt = `
  You are a strict Duolingo English Test rater. Evaluate this text: "${text}"
  Categorize the feedback deeply and return strictly in this JSON format:
  {
    "score": number(10-160),
    "feedback": "A short, encouraging summary in Korean",
    "vocabulary": [
      {"word": "단어", "meaning": "뜻/설명", "example": "A generic daily-life example sentence"}
    ],
    "phrasal_verbs": [
      {"phrase": "구동사/연어", "meaning": "뜻", "example": "예문"}
    ],
    "grammar_focus": [
      {"original": "틀린/어색한 문장", "corrected": "교정된 문장", "reason": "문법적 설명"}
    ],
    "writing_analysis": [
      {"point": "구조/표현에 대한 분석 코멘트"}
    ]
  }`;
