const MAX_INPUT_LENGTH = 5000;
// Language names go into the prompt, so they're capped too ("Portuguese (Portugal)" is the longest)
const MAX_LANG_LENGTH = 40;

function validateInput(req, res, next) {
  const { inputText, targetLang, inputLang } = req.body;

  if (typeof inputText !== "string" || !inputText.trim()) {
    return res.status(400).json({ error: "inputText is required" });
  }
  if (inputText.length > MAX_INPUT_LENGTH) {
    return res
      .status(400)
      .json({ error: `inputText exceeds ${MAX_INPUT_LENGTH} characters` });
  }
  if (typeof targetLang !== "string" || !targetLang.trim()) {
    return res.status(400).json({ error: "targetLang is required" });
  }
  if (inputLang !== undefined && typeof inputLang !== "string") {
    return res.status(400).json({ error: "inputLang must be a string" });
  }
  if (targetLang.length > MAX_LANG_LENGTH || (inputLang?.length ?? 0) > MAX_LANG_LENGTH) {
    return res.status(400).json({ error: "Language names are too long" });
  }

  next();
}

module.exports = { validateInput };
