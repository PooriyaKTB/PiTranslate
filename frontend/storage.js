export function getJSON(key, fallback) {
  const raw = localStorage.getItem(key);
  if (!raw) return fallback;

  try {
    return JSON.parse(raw);
  } catch {
    console.warn(`Corrupted localStorage value for "${key}", resetting.`);
    localStorage.removeItem(key);
    return fallback;
  }
}
