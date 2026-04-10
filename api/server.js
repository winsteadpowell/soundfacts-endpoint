import OpenAI from "openai";

export const config = {
  runtime: "edge",
};
@@ -17,28 +19,122 @@ export default async function handler(req) {
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ step: "method-check", error: "Method not allowed" }),
      {
        status: 405,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    });
  }

  try {
    let body;
    const body = await req.json();
    const { song, artist } = body || {};

    if (!song || !artist) {
      return new Response(
        JSON.stringify({ error: "Song and artist are required" }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    if (!process.env.OPENAI_API_KEY) {
      return new Response(
        JSON.stringify({ error: "Missing OPENAI_API_KEY" }),
        {
          status: 500,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const prompt = `
You are a professional music analyst for a project called Sound Facts.

Analyze the song "${song}" by "${artist}".

Return only valid JSON in this exact structure:

{
  "song": "string",
  "artist": "string",
  "year": "string",
  "genre": "string",
  "runtime": "string",
  "summary": "string",
  "core_categories": {
    "emotional_honesty": {
      "score": 1,
      "comment": "string"
    },
    "storytelling": {
      "score": 1,
      "comment": "string"
    },
    "melodic_complexity": {
      "score": 1,
      "comment": "string"
    },
    "lyrical_depth": {
      "score": 1,
      "comment": "string"
    },
    "vocal_delivery": {
      "score": 1,
      "comment": "string"
    },
    "production_quality": {
      "score": 1,
      "comment": "string"
    },
    "originality": {
      "score": 1,
      "comment": "string"
    },
    "replay_value": {
      "score": 1,
      "comment": "string"
    }
  },
  "overall_score": 1
}

Rules:
- Return JSON only
- No markdown
- No explanation outside the JSON
- Scores must be integers from 1 to 10
`;

    const response = await openai.responses.create({
      model: "gpt-4.1-mini",
      input: prompt,
    });

    const text = response.output_text;

    let parsed;
    try {
      body = await req.json();
    } catch (e) {
      parsed = JSON.parse(text);
    } catch (parseError) {
      return new Response(
        JSON.stringify({
          step: "req.json",
          error: e?.message || "req.json failed",
          error: "AI returned invalid JSON",
          raw: text,
        }),
        {
          status: 500,
@@ -50,34 +146,24 @@ export default async function handler(req) {
      );
    }

    const { song, artist } = body || {};

    return new Response(
      JSON.stringify({
        step: "body-parsed",
        body,
        song,
        artist,
        hasApiKey: !!process.env.OPENAI_API_KEY,
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
    return new Response(JSON.stringify(parsed), {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({
        step: "outer-catch",
        error: error?.message || "Internal server error",
        error: error.message || "Internal server error",
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
          "Content-Type": "application/json",
        },
      }
