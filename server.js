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
You are a professional musi
