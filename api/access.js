// Tells the start screen whether the live conversation needs an access code,
// and checks a code before the call starts. The code itself is never sent to
// the browser; it lives only in Vercel's ACCESS_CODE setting.

export default function handler(req, res) {
  const code = process.env.ACCESS_CODE;
  if (req.method === "GET") {
    res.status(200).json({ required: Boolean(code) });
    return;
  }
  if (req.method === "POST") {
    const ok = !code || req.headers["x-access-code"] === code;
    res.status(ok ? 200 : 401).json({ ok });
    return;
  }
  res.status(405).json({ error: "Use GET or POST." });
}
