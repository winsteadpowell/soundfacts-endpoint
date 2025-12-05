import OpenAI from "openai";

// Allow CORS for browser requests
export const config = {
  runtime: "edge",
};

export default async function handler(req) {
  // Handle OPTIONS preflight (this is what was failing)
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: {
        "Access-Control-Allow-Origin": "*",
      },
    });
  }

  try {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const body = await req.json();

    const { song, artist } = body;

    const prompt = `
You are a professional music analyst. Return ONLY valid JSON with this structure:

{
  "song": "",
  "artist": "",
  "year": "",
  "genre": "",
  "runtime": "",
  "summary": "",
  "core_categories": {
      "emotional_honesty": { "score": 1-10, "comment": "" },
      "storytelling": { "score": 1-10, "comment": "" },
      "melodic_complexity": { "score": 1-10, "comment": "" },
      "vocal_performance": { "score": 1-10, "comment": "" },
      "production_quality": { "score": 1-10, "comment": "" },
      "cultural_imprint": { "score": 1-10, "comment": "" },
      "replay_value": { "score": 1-10, "comment": "" },
      "overall_impression": { "score": 1-10, "comment": "" }
  }
}

Song: ${song}
Artist: ${artist}
`;

    const completion = await openai.responses.create({
      model: "gpt-4o-mini",
      input: prompt,
    });

    let text = completion.output_text;

    // Ensure pure JSON
    text = text.trim();
    if (text.startsWith("```")) {
      text = text.replace(/```json/g, "").replace(/```/g, "");
    }

    return new Response(text, {
      status: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "application/json",
      },
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: {
        "Access-Control-Allow-Origin": "*",
      },
    });
  }
}
