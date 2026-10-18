const express = require("express");
const { chat } = require("../utils/openai");
const { validateInput } = require("../utils/validateInput");
const { handleOpenAIError } = require("../utils/handleOpenAIError");

const router = express.Router();

router.post("/", validateInput, async (req, res) => {
  const { inputText, targetLang, inputLang } = req.body;
  const from = inputLang && inputLang !== "auto" ? ` from ${inputLang}` : "";

  try {
    const translation = await chat({
      system:
        "You are a professional translator. Translate the given text accurately. Only return the translated text, nothing else.",
      user: `Translate the following text${from} to ${targetLang}:\n"${inputText}"`,
      temperature: 0.3,
    });
    res.json({ translation });
  } catch (error) {
    handleOpenAIError(error, res, "Translation");
  }
});

module.exports = router;
