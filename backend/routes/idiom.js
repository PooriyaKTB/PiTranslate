const express = require("express");
const router = express.Router();
const OpenAI = require("openai");

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

router.post("/", async (req, res) => {
  const { inputText, inputLang, targetLang } = req.body;
  try {
    const prompt = `
      You're a translation and idiom assistant.

      Input: "${inputText}"
      Input Language: ${inputLang}
      Target Language: ${targetLang}

      1. Find an idiom or proverb in ${inputLang} that directly relates to the meaning of "${inputText}".
        - If none exists, find one closely related to a common synonym.
        - The idiom must be native to ${inputLang} and culturally appropriate.

      2. Provide the best natural equivalent of that idiom in ${targetLang}, not a word-for-word translation.

      Respond in this exact JSON format:
      {
        "idiom": "...",
        "meaning": "...",
        "equivalent": "..."
      }
    `;

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
    });

    const content = completion.choices[0].message.content.trim();
    const parsed = JSON.parse(content);

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
