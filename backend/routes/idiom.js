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
  const { inputText, inputLang, targetLang } = req.body;

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

  const sourceLangInstruction =
    !inputLang || inputLang === "auto"
      ? "Auto-detect the language of the input text"
      : `The input language is ${inputLang}`;

  try {
    const prompt = `${sourceLangInstruction}.

Input: "${inputText}"
Target Language: ${targetLang}

1. Find an idiom or proverb in the input language that directly relates to the meaning of "${inputText}".
   - If none exists, find one closely related to a common synonym.
   - The idiom must be native to the input language and culturally appropriate.

2. Provide the best natural equivalent of that idiom in ${targetLang}, not a word-for-word translation.

Respond in this exact JSON format:
{
  "idiom": "...",
  "meaning": "...",
  "equivalent": "..."
}`;

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content:
            "You are a translation and idiom assistant. Always respond with valid JSON only, no extra text.",
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.7,
      response_format: { type: "json_object" },
    });

    const content = completion.choices[0].message.content.trim();
    const parsed = tryParseJSON(content);

    res.json({
      idiom: parsed.idiom || "Not available",
      meaning: parsed.meaning || "Not available",
      equivalent: parsed.equivalent || "Not available",
    });
  } catch (error) {
    res.status(500).json({
      error: "Idiom generation failed",
      details: error.message,
    });
  }
});

module.exports = router;
