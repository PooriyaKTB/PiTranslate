const OpenAI = require("openai");

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const MODEL = "gpt-4.1-mini";

// Sends a system + user prompt and returns the reply text,
// or the parsed object when `json` is true (OpenAI JSON mode).
async function chat({ system, user, temperature, json = false }) {
  const completion = await openai.chat.completions.create({
    model: MODEL,
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
    temperature,
    ...(json && { response_format: { type: "json_object" } }),
  });

  const content = completion.choices[0].message.content.trim();
  return json ? JSON.parse(content) : content;
}

module.exports = { chat };
