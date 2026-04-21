// pages/api/chat.js
// ✅ API 키는 이 서버 파일에서만 사용됩니다.
// 브라우저(클라이언트)에는 절대 전달되지 않습니다.
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export default async function handler(req, res) {
  // POST 요청만 허용
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { system, message } = req.body || {};

  // 필수값 체크
  if (!system || !message) {
    return res.status(400).json({ error: "system과 message가 필요합니다" });
  }

  // 과도한 입력 차단 (토큰 낭비 방지)
  if (message.length > 12000) {
    return res.status(400).json({ error: "입력이 너무 깁니다 (최대 12,000자)" });
  }

  // 서버 환경변수 체크
  if (!process.env.OPENAI_API_KEY) {
    return res.status(500).json({ error: "서버에 API 키가 설정되지 않았습니다. Vercel 환경변수를 확인하세요." });
  }

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      max_tokens: 4000,  // 토큰 왕창
      temperature: 0.7,
      messages: [
        { role: "system", content: system },
        { role: "user",   content: message },
      ],
    });

    const result = completion.choices?.[0]?.message?.content || "";
    return res.status(200).json({ result });

  } catch (err) {
    console.error("OpenAI error:", err);
    if (err?.status === 401) return res.status(500).json({ error: "API 키가 유효하지 않습니다" });
    if (err?.status === 429) return res.status(429).json({ error: "요청이 너무 많습니다. 잠시 후 다시 시도하세요" });
    if (err?.status === 500) return res.status(502).json({ error: "OpenAI 서버 오류입니다. 잠시 후 다시 시도하세요" });
    return res.status(500).json({ error: err?.message || "AI 요청 중 오류 발생" });
  }
}
