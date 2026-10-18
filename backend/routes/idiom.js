const express = require("express");
const { chat } = require("../utils/openai");
const { validateInput } = require("../utils/validateInput");
const { handleOpenAIError } = require("../utils/handleOpenAIError");

const router = express.Router();

router.post("/", validateInput, async (req, res) => {
  const { inputText, targetLang, inputLang } = req.body;
  const sourceLangInstruction =
    !inputLang || inputLang === "auto"
      ? "Auto-detect the language of the input text"
      : `The input language is ${inputLang}`;

  try {
    const data = await chat({
      system:
        "You are a translation and idiom assistant. Always respond with valid JSON only, no extra text.",
      user: `${sourceLangInstruction}.

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
}`,
      temperature: 0.7,
      json: true,
    });

    res.json({
      idiom: data.idiom || "Not available",
      meaning: data.meaning || "Not available",
      equivalent: data.equivalent || "Not available",
    });
  } catch (error) {
    handleOpenAIError(error, res, "Idiom generation");
  }
});

module.exports = router;
