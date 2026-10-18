const MAX_INPUT_LENGTH = 5000;

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

  next();
}

module.exports = { validateInput };
