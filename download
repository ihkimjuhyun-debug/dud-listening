// pages/api/chat.js
// ✅ API 키는 서버에서만 사용 - 클라이언트에 절대 노출되지 않음
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // Vercel 환경변수에서만 읽음
});

export default async function handler(req, res) {
  // POST만 허용
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { system, message } = req.body;

  if (!system || !message) {
    return res.status(400).json({ error: "system and message are required" });
  }

  // 너무 긴 요청 차단 (토큰 낭비 방지)
  if (message.length > 8000) {
    return res.status(400).json({ error: "Message too long (max 8000 chars)" });
  }

  // API 키 설정 확인
  if (!process.env.OPENAI_API_KEY) {
    return res.status(500).json({ error: "OpenAI API key not configured on server" });
  }

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      max_tokens: 1500,
      messages: [
        { role: "system", content: system },
        { role: "user", content: message },
      ],
    });

    const text = completion.choices?.[0]?.message?.content || "";
    return res.status(200).json({ result: text });

  } catch (err) {
    console.error("OpenAI API error:", err);

    // OpenAI 에러 코드별 처리
    if (err?.status === 401) {
      return res.status(500).json({ error: "API 키가 유효하지 않습니다. Vercel 환경변수를 확인해주세요." });
    }
    if (err?.status === 429) {
      return res.status(429).json({ error: "요청이 너무 많습니다. 잠시 후 다시 시도해주세요." });
    }
    if (err?.status === 500) {
      return res.status(502).json({ error: "OpenAI 서버 오류입니다. 잠시 후 다시 시도해주세요." });
    }

    return res.status(500).json({ error: "AI 요청 중 오류가 발생했습니다." });
  }
}
