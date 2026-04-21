import OpenAI from "openai";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  if (!process.env.OPENAI_API_KEY) return res.status(500).json({ error: "서버에 OPENAI_API_KEY가 없습니다. Vercel 환경변수를 확인하세요." });

  const { system, message } = req.body || {};
  if (!system || !message) return res.status(400).json({ error: "system과 message가 필요합니다." });
  if (message.length > 14000) return res.status(400).json({ error: "입력이 너무 깁니다." });

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  try {
    const c = await openai.chat.completions.create({
      model: "gpt-4o", max_tokens: 4000, temperature: 0.7,
      messages: [{ role: "system", content: system }, { role: "user", content: message }],
    });
    return res.status(200).json({ result: c.choices?.[0]?.message?.content || "" });
  } catch (err) {
    if (err?.status === 401) return res.status(401).json({ error: "API 키가 유효하지 않습니다." });
    if (err?.status === 429) return res.status(429).json({ error: "요청이 너무 많습니다. 잠시 후 다시 시도하세요." });
    return res.status(500).json({ error: err?.message || "AI 오류" });
  }
}
