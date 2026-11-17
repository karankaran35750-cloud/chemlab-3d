/**
 * CHEMVERSE 3D — SECURE SERVERLESS GEMINI PROXY
 * File: api/gemini-proxy.js
 * Keeps GEMINI_API_KEY strictly on the server (process.env.GEMINI_API_KEY).
 * Zero secret data is ever transmitted to or visible in the user's browser.
 */

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(503).json({ error: "Server AI key not configured. Falling back to local engine." });
  }

  try {
    const { prompt, telemetry } = req.body || {};
    const systemInstruction = `You are the ChemVerse 3D AI Co-Scientist.
Live 3D Multi-Vessel Telemetry:
${JSON.stringify(telemetry || {}, null, 2)}

When asked to synthesize or simulate a reaction on demand, append a single-line JSON command block wrapped in <LAB_CMD>...</LAB_CMD>:
<LAB_CMD>{"action":"SYNTHESIZE_REACTION","reactantA":"Phenol","reactantB":"Br2_water","equation":"C6H5OH + 3 Br2(aq) -> C6H2Br3OH(s) + 3 HBr","colorHex":"#F8FAFC","deltaH":-96,"hasPpt":true,"hasGas":false}</LAB_CMD>`;

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(apiKey)}`;
    const upstream = await fetch(geminiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemInstruction }] },
        contents: [{ role: "user", parts: [{ text: String(prompt || "") }] }],
        generationConfig: { temperature: 0.3, maxOutputTokens: 500 }
      })
    });

    if (!upstream.ok) {
      return res.status(upstream.status).json({ error: "Upstream Gemini API error" });
    }

    const data = await upstream.json();
    const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
    return res.status(200).json({ reply });
  } catch (err) {
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
