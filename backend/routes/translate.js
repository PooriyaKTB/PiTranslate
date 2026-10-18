const express = require("express");
const { chat } = require("../utils/openai");
const { validateInput } = require("../utils/validateInput");
const { handleOpenAIError } = require("../utils/handleOpenAIError");

const router = express.Router();

// Pronunciation and spelling help are for words and phrases; on long texts they
// would roughly double the output (and the wait), so they're skipped there.
const EXTRAS_MAX_CHARS = 300;

// Models sometimes wrap the whole answer in quotes despite being told not to.
const QUOTE_PAIRS = ['""', "''", "“”", "„“", "«»", "「」"];
function stripQuotes(text) {
  const t = text.trim();
  const inner = t.slice(1, -1);
  // Only strip when the pair wraps everything, not `"Hi" and "bye"`
  const wrapped = QUOTE_PAIRS.some(
    ([open, close]) => t.startsWith(open) && t.endsWith(close) && !inner.includes(close)
  );
  return wrapped && t.length > 1 ? inner.trim() : t;
}

function asString(value) {
  return typeof value === "string" ? value.trim() : "";
}

router.post("/", validateInput, async (req, res) => {
  const { inputText, targetLang, inputLang } = req.body;
  const detect = !inputLang || inputLang === "auto";
  const extras = inputText.length <= EXTRAS_MAX_CHARS;

  const fields = [
    `"translation": the ${targetLang} translation of what the user most likely meant, without quotes.`,
    detect && `"detectedLanguage": the English name of the input's language, e.g. "Spanish".`,
    extras &&
      `"pronunciation": how to pronounce the translation, the way a dictionary shows it. If ${targetLang} is written in the Latin alphabet, give the IPA transcription between slashes (e.g. "/həˈləʊ/"). Otherwise give its standard romanization in Latin letters (e.g. pinyin with tone marks for Chinese, romaji for Japanese, "sobh bekheyr" for Persian).`,
    extras &&
      `"correction": the input with obvious spelling mistakes fixed, or "" if there are none. Don't change names, slang, informal wording, or text written in a non-native script (e.g. Persian in Latin letters).`,
  ].filter(Boolean);

  try {
    const data = await chat({
      system:
        "You are a professional translator. Translate the given text accurately and naturally. Always respond with valid JSON only.",
      user: `Translate the following text${detect ? "" : ` from ${inputLang}`} to ${targetLang}:
"${inputText}"

Respond with a JSON object with these fields:
${fields.map((f) => `- ${f}`).join("\n")}`,
      temperature: 0.3,
      json: true,
    });

    const translation = stripQuotes(asString(data.translation));
    if (!translation) throw new SyntaxError("Missing translation in AI response");

    const correction = asString(data.correction);
    res.json({
      translation,
      pronunciation: asString(data.pronunciation),
      detectedLanguage: detect ? asString(data.detectedLanguage) : "",
      // A "correction" identical to the input isn't one
      correction: correction && correction !== inputText.trim() ? correction : "",
    });
  } catch (error) {
    handleOpenAIError(error, res, "Translation");
  }
});

module.exports = router;
