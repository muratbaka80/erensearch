import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });

  const { query, languages } = req.body;
  if (!query || !languages || languages.length === 0) {
    return res.status(400).json({ error: "query ve languages gerekli" });
  }

  const langList = languages.map(l => `${l.name} (${l.code})`).join(", ");
  const prompt = `Translate the following search query into these languages: ${langList}.
Query: "${query}"
Respond ONLY with a JSON array. Each object: {"code":"xx","translation":"...","phonetic":"..."} (phonetic only for non-Latin scripts, otherwise empty string). No markdown, no backticks.`;

  try {
    const message = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      messages: [{ role: "user", content: prompt }],
    });
    const text = message.content.filter(b => b.type === "text").map(b => b.text).join("");
    const translations = JSON.parse(text.replace(/```json|```/g, "").trim());
    return res.status(200).json({ translations });
  } catch (err) {
    return res.status(500).json({ error: "Çeviri hatası", detail: err.message });
  }
}
