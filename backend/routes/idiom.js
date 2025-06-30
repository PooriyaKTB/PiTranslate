const express = require("express");
const router = express.Router();
const OpenAI = require("openai");

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

router.post("/", async (req, res) => {
  const { inputText } = req.body;
  try {
    const prompt = `Find a relevant idiom in English for the word or concept "${inputText}". Include the idiom and its meaning.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
    });

    const content = completion.choices[0].message.content.trim();
    res.json({ idiom: content });
  } catch (error) {
    res
      .status(500)
      .json({ error: "Idiom generation failed", details: error.message });
  }
});

module.exports = router;
