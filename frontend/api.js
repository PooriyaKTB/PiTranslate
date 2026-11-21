import { showToast } from "./toast.js";

const IS_LOCAL = ["localhost", "127.0.0.1"].includes(location.hostname);
const API_BASE = IS_LOCAL
  ? "http://localhost:5050/api"
  : "https://pooriya-pitranslate.grads.hosting.cyf.academy/api";
const TIMEOUT_MS = 15000;

// POSTs to the backend and returns the parsed JSON, or null after showing a toast.
// The optional button shows a spinner and is disabled while the request runs.
export async function apiCall(endpoint, payload, button) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);
  if (button) {
    button.disabled = true;
    button.classList.add("is-loading");
  }

  try {
    const res = await fetch(`${API_BASE}/${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    const body = await res.json().catch(() => null);

    if (!res.ok || !body) {
      showToast(body?.error || `Request failed (${res.status}). Please try again.`, "warning");
      return null;
    }
    return body;
  } catch (error) {
    showToast(
      error.name === "AbortError"
        ? "The request timed out. Please try again."
        : "Can't reach the server. Check your connection and try again.",
      "warning"
    );
    return null;
  } finally {
    clearTimeout(timeoutId);
    if (button) {
      button.disabled = false;
      button.classList.remove("is-loading");
    }
  }
}
