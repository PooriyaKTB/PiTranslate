function handleOpenAIError(error, res, label) {
  console.error(`${label} error:`, error);

  if (error.status === 429) {
    return res.status(429).json({
      error: "Too many requests to the translation service. Please try again shortly.",
    });
  }

  if (error.status === 401 || error.status === 403) {
    return res.status(500).json({ error: `${label} failed` });
  }

  if (typeof error.status === "number" && error.status >= 500) {
    return res
      .status(502)
      .json({ error: "Translation service is temporarily unavailable." });
  }

  if (
    error.name === "SyntaxError" ||
    error.message === "Failed to parse AI response as valid JSON"
  ) {
    return res
      .status(502)
      .json({ error: "Received an unexpected response. Please try again." });
  }

  if (error.status === undefined) {
    return res
      .status(503)
      .json({ error: "Could not reach the translation service. Please try again." });
  }

  return res.status(500).json({ error: `${label} failed` });
}

module.exports = { handleOpenAIError };
