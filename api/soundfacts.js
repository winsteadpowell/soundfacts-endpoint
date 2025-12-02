import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Paste your FINAL Sound Facts prompt from the Developer Pack here:
const SOUND_FACTS_PROMPT = `
PASTE YOUR SOUND FACTS API PROMPT HERE
`;

export default async function handler(req, res) {
  // ✅ Add CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*"); // or restrict to your frontend domain
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  // ✅ Handle preflight requests
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: true, message: "POST only" });
  }

  try {
    const { song, artist } = req.body || {};
    if (!song || !artist) {
      return res.status(400).json({
        error: true,
        message: "Missing required fields: song and artist."
      });
    }

    const response = await openai.responses.create({
      model: "gpt-5.1-mini",
      input: [
        { role: "developer", content: SOUND_FACTS_PROMPT },
        {
          role: "user",
          content: `Analyze this song.
Song: ${song}
Artist: ${artist}
Return ONLY valid JSON in Sound Facts format.`
        }
      ]
    });

    const text = response.output_text;

    try {
      const json = JSON.parse(text);
      return res.status(200).json(json);
    } catch {
      return res.status(200).json({
        error: true,
        message: "Model returned invalid JSON.",
        raw: text
      });
    }
  } catch (e) {
    console.error(e);
    return res.status(500).json({
      error: true,
      message: "Sound Facts backend error."
    });
  }
}
