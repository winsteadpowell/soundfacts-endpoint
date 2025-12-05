import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const SOUND_FACTS_PROMPT = `You are a professional music analyst. Analyze the given song and return ONLY a valid JSON object with this exact structure:

{
  "song": "song title",
  "artist": "artist name",
  "year": "release year (e.g., 1975)",
  "genre": "genre(s)",
  "runtime": "duration (e.g., 5:55)",
  "summary": "2-3 sentence professional summary of the song",
  "core_categories": {
    "emotional_honesty": { "score": 1-10, "comment": "brief explanation" },
    "storytelling": { "score": 1-10, "comment": "brief explanation" },
    "melodic_complexity": { "score": 1-10, "comment": "brief explanation" },
    "vocal_performance": { "score": 1-10, "comment": "brief explanation" },
    "production_quality": { "score": 1-10, "comment": "brief explanation" },
    "cultural_imprint": { "score": 1-10, "comment": "brief explanation" },
    "replay_value": { "score": 1-10, "comment": "brief explanation" },
    "overall_impact": { "score": 1-10, "comment": "brief explanation" }
  },
  "expansion_categories": [
    { "category": "category name", "score": 1-10, "comment": "explanation" }
  ],
  "final_score": 1-10
}

Ensure all scores are integers between 1 and 10. Make comments concise but meaningful.`;

export default async function handler(req, res) {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
    return res.status(200).end();
  }

  // CORS for actual requests
  res.setHeader("Access-Control-Allow-Origin", "*");

  // Block non-POST requests
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
          content: `Analyze this song.\nSong: ${song}\nArtist: ${artist}\nReturn ONLY valid JSON.`
        }
      ]
    });

    let text = response.output_text;

    // Strip markdown fences if present
    const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
      text = jsonMatch[1];
    }

    try {
      const json = JSON.parse(text);
      return res.status(200).json(json);
    } catch (parseError) {
      return res.status(200).json({
        error: true,
        message: "Model returned invalid JSON.",
        raw: text,
        parseError: parseError.message
      });
    }
  } catch (e) {
    console.error("Sound Facts backend error:", e);
    return res.status(500).json({
      error: true,
      message: "Sound Facts backend error",
      details: e.message
    });
  }
}
