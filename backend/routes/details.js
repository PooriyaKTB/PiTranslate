const express = require("express");
const router = express.Router();
const OpenAI = require("openai");

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

router.post("/", async (req, res) => {
  const { inputText, targetLang } = req.body;

  try {
    const prompt = `
You are an assistant helping with language learning.

For the word or phrase: "${inputText}", do the following:

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
}
`;

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
