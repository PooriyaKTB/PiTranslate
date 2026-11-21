const OpenAI = require("openai");
const { InvalidAIResponseError } = require("./openai");

// Maps a failed AI call to a client-safe HTTP response (never leaks key/auth problems).
function handleOpenAIError(error, res, label) {
  console.error(`${label} error:`, error);

  if (error instanceof InvalidAIResponseError) {
    return res
      .status(502)
      .json({ error: "Received an unexpected response. Please try again." });
  }

  // Network failures and timeouts (a subclass of APIError, so checked first)
  if (error instanceof OpenAI.APIConnectionError) {
    return res
      .status(503)
      .json({ error: "Could not reach the AI service. Please try again." });
  }

  if (error instanceof OpenAI.APIError) {
    if (error.status === 429) {
      return res.status(429).json({
        error: "Too many requests to the AI service. Please try again shortly.",
      });
    }
    if (error.status >= 500) {
      return res
        .status(502)
        .json({ error: "The AI service is temporarily unavailable." });
    }
  }

  // 401/403 (bad key), other 4xx, and bugs in our own code
  return res.status(500).json({ error: `${label} failed` });
}

module.exports = { handleOpenAIError };
