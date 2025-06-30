const express = require("express");
const router = express.Router();
const OpenAI = require("openai");

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

router.post("/", async (req, res) => {
  const { inputText, targetLang, inputLang } = req.body;

  try {
    const prompt = `Translate the following text${
      inputLang ? ` from ${inputLang}` : ""
    } to ${targetLang}:
"${inputText}"`;

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
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
