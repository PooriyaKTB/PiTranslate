const express = require("express");
const router = express.Router();
const OpenAI = require("openai");

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

router.post("/", async (req, res) => {
  const { inputText } = req.body;

  try {
    const prompt = `Provide two different example sentences using the word or phrase "${inputText}", and list some common synonyms for it.Return the result in this exact JSON format:
{
  "examples": ["sentence 1", "sentence 2"],
  "synonyms": ["synonym 1", "synonym 2"]
}`;

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.5,
    });

    const content = completion.choices[0].message.content.trim();

    const parsed = JSON.parse(content); 

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
