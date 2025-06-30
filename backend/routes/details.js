const express = require("express");
const router = express.Router();
const OpenAI = require("openai");

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

router.post("/", async (req, res) => {
  const { inputText } = req.body;

  try {
    const prompt = `Provide two different example sentences using the word or phrase "${inputText}", and list some common synonyms for it.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.5,
    });

    const content = completion.choices[0].message.content.trim();
    res.json({ result: content });
  } catch (error) {
    res
      .status(500)
      .json({ error: "Details generation failed", details: error.message });
  }
});

module.exports = router;
