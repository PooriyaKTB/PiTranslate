const express = require("express");
const router = express.Router();
const OpenAI = require("openai");

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const MAX_INPUT_LENGTH = 5000;

function tryParseJSON(content) {
  try {
    return JSON.parse(content);
  } catch {
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[1].trim());
    }
    throw new Error("Failed to parse AI response as valid JSON");
  }
}

router.post("/", async (req, res) => {
  const { inputText, targetLang } = req.body;

  if (!inputText || typeof inputText !== "string" || !inputText.trim()) {
    return res.status(400).json({ error: "inputText is required" });
  }
  if (!targetLang || typeof targetLang !== "string") {
    return res.status(400).json({ error: "targetLang is required" });
  }
  if (inputText.length > MAX_INPUT_LENGTH) {
    return res
      .status(400)
      .json({ error: `inputText exceeds ${MAX_INPUT_LENGTH} characters` });
  }

  try {
    const prompt = `For the word or phrase: "${inputText}", do the following:

1. Give two clear example sentences showing different usages.
2. For each example, also include its translation to ${targetLang}.
3. List up to 3 common synonyms.
4. For each synonym, give its translation to ${targetLang}.

Respond strictly in this JSON format:

{
  "examples": [
    { "text": "example sentence 1", "translation": "..." },
    { "text": "example sentence 2", "translation": "..." }
  ],
  "synonyms": [
    { "word": "synonym1", "translation": "..." },
    { "word": "synonym2", "translation": "..." }
  ]
}`;

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content:
            "You are a language learning assistant. Always respond with valid JSON only, no extra text.",
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.5,
      response_format: { type: "json_object" },
    });

    const content = completion.choices[0].message.content.trim();
    const parsed = tryParseJSON(content);

    res.json({
      examples: parsed.examples || "Not available",
      synonyms: parsed.synonyms || "Not available",
    });
  } catch (error) {
    res
      .status(500)
      .json({ error: "Details generation failed", details: error.message });
  }
});

module.exports = router;
