export default function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  if (!process.env.ADMIN_PIN) return res.status(500).json({ error: "ADMIN_PIN이 설정되지 않았습니다." });
  const { pin } = req.body || {};
  if (!pin) return res.status(400).json({ ok: false });
  const s = String(process.env.ADMIN_PIN), c = String(pin);
  if (c.length !== s.length || c !== s) return setTimeout(() => res.status(401).json({ ok: false }), 300);
  return res.status(200).json({ ok: true });
}
