const express = require("express");
const router = express.Router();
const OpenAI = require("openai");

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const MAX_INPUT_LENGTH = 5000;

router.post("/", async (req, res) => {
  const { inputText, targetLang, inputLang } = req.body;

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
    const completion = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: [
        {
          role: "system",
          content:
            "You are a professional translator. Translate the given text accurately. Only return the translated text, nothing else.",
        },
        {
          role: "user",
          content: `Translate the following text${
            inputLang && inputLang !== "auto" ? ` from ${inputLang}` : ""
          } to ${targetLang}:\n"${inputText}"`,
        },
      ],
      temperature: 0.3,
    });

    const result = completion.choices[0].message.content.trim();
    res.json({ translation: result });
  } catch (error) {
    res
      .status(500)
      .json({ error: "Translation failed", details: error.message });
  }
});

module.exports = router;
