// Helpers for cleaning model output before it reaches the client.

function asString(value) {
  return typeof value === "string" ? value.trim() : "";
}

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

// Keeps well-formed { [key], translation } items from a model-generated list.
function pairs(items, key) {
  if (!Array.isArray(items)) return [];
  return items
    .map((item) => ({ [key]: asString(item?.[key]), translation: asString(item?.translation) }))
    .filter((item) => item[key]);
}

module.exports = { asString, stripQuotes, pairs };
