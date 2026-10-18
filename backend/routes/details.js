const express = require("express");
const { chat } = require("../utils/openai");
const { validateInput } = require("../utils/validateInput");
const { handleOpenAIError } = require("../utils/handleOpenAIError");

const router = express.Router();

router.post("/", validateInput, async (req, res) => {
  const { inputText, targetLang } = req.body;

  try {
    const data = await chat({
      system:
        "You are a language learning assistant. Always respond with valid JSON only, no extra text.",
      user: `For the word or phrase: "${inputText}", do the following:

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
}`,
      temperature: 0.5,
      json: true,
    });

    res.json({
      examples: Array.isArray(data.examples) ? data.examples : [],
      synonyms: Array.isArray(data.synonyms) ? data.synonyms : [],
    });
  } catch (error) {
    handleOpenAIError(error, res, "Details generation");
  }
});

module.exports = router;
