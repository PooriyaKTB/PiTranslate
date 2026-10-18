const OpenAI = require("openai");

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Luna reasons before answering by default; translation doesn't need it, and it
// costs latency and output tokens. The fast tier brings latency close to
// gpt-4.1-mini (shut down Jan 2027) at roughly half its price.
const MODEL = "gpt-6-luna";
const MODEL_OPTIONS = { reasoning_effort: "none", service_tier: "fast" };

// Sends a system + user prompt and returns the reply text,
// or the parsed object when `json` is true (OpenAI JSON mode).
async function chat({ system, user, temperature, json = false }) {
  const completion = await openai.chat.completions.create({
    model: MODEL,
    ...MODEL_OPTIONS,
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
