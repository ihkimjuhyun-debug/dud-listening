// api/evaluate.js
export default async function handler(req, res) {
  // POST 요청만 허용
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { text } = req.body;
  // Vercel 환경 변수에서 API 키를 안전하게 가져옴 (브라우저엔 절대 노출 안 됨)
  const API_KEY = process.env.GEMINI_API_KEY; 

  if (!API_KEY) {
    return res.status(500).json({ error: 'API Key is missing on the server' });
  }

  try {
    const prompt = `
      You are a strict Duolingo English Test rater. Evaluate this description: "${text}"
      Return strictly in JSON format without markdown code blocks:
      {
        "score": number(10-160),
        "feedback": "A short, encouraging summary in Korean",
        "corrections": [{"original": "error word", "better": "corrected word"}]
      }`;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
    });

    const data = await response.json();
    const resultText = data.candidates[0].content.parts[0].text;
    
    // 마크다운 백틱(```json)이 섞여 들어오는 것을 방지하기 위해 정제 후 파싱
    const cleanJson = resultText.replace(/```json/g, '').replace(/```/g, '').trim();
    
    // 프론트엔드로 안전하게 결과만 전달
    res.status(200).json(JSON.parse(cleanJson));

  } catch (error) {
    console.error("Evaluation Error:", error);
    res.status(500).json({ error: 'Failed to evaluate the text' });
  }
}
