// Jordan's natural voice (ElevenLabs). The server turns Jordan's reply into
// speech, so the ElevenLabs key never reaches the browser.
//
// Settings (Vercel → Settings → Environment Variables):
//   ELEVENLABS_API_KEY   required to turn natural voice on
//   ELEVENLABS_VOICE_ID  which voice plays Jordan (copy the ID from your ElevenLabs voice library)
//   ELEVENLABS_MODEL     optional; defaults to eleven_multilingual_v2
//
// If there's no key, or anything goes wrong, the browser falls back to its
// built-in voice, so the call always keeps working.

const DEFAULT_VOICE = "21m00Tcm4TlvDq8ikWAM"; // a stock female voice; replace with Jordan's chosen voice
const MAX_CHARS = 1500;

export default async function handler(req, res) {
  const key = process.env.ELEVENLABS_API_KEY;

  // GET: tells the browser whether natural voice is switched on.
  if (req.method === "GET") {
    res.status(200).json({ enabled: Boolean(key) });
    return;
  }
  if (req.method !== "POST") {
    res.status(405).json({ error: "Use GET or POST." });
    return;
  }
  if (!key) {
    res.status(404).json({ error: "Natural voice isn't set up." });
    return;
  }

  const text = typeof req.body?.text === "string" ? req.body.text.trim().slice(0, MAX_CHARS) : "";
  if (!text) {
    res.status(400).json({ error: "No text to speak." });
    return;
  }

  const voice = process.env.ELEVENLABS_VOICE_ID || DEFAULT_VOICE;
  const model = process.env.ELEVENLABS_MODEL || "eleven_multilingual_v2";
  try {
    const r = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voice)}?output_format=mp3_44100_128`,
      {
        method: "POST",
        headers: { "xi-api-key": key, "Content-Type": "application/json", Accept: "audio/mpeg" },
        body: JSON.stringify({ text, model_id: model }),
      }
    );
    if (!r.ok) {
      console.error("ElevenLabs error", r.status, (await r.text()).slice(0, 300));
      res.status(502).json({ error: "The voice service had a problem." });
      return;
    }
    const audio = Buffer.from(await r.arrayBuffer());
    res.setHeader("Content-Type", "audio/mpeg");
    res.setHeader("Cache-Control", "no-store");
    res.status(200).send(audio);
  } catch (error) {
    console.error("ElevenLabs request failed", error);
    res.status(502).json({ error: "The voice service couldn't be reached." });
  }
}
