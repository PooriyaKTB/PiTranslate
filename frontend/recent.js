import { getJSON } from "./storage.js";
import { el } from "./dom.js";

const KEY = "recentTranslations";
const MAX_ITEMS = 5;

export function loadRecent() {
  return getJSON(KEY, []);
}

// Newest first; translating the same text into the same language again moves it to the top.
export function addRecent(entry) {
  const same = (r) =>
    r.text.toLowerCase() === entry.text.toLowerCase() && r.langCode === entry.langCode;
  const list = [entry, ...loadRecent().filter((r) => !same(r))].slice(0, MAX_ITEMS);
  localStorage.setItem(KEY, JSON.stringify(list));
}

export function clearRecent() {
  localStorage.removeItem(KEY);
}

export function renderRecent({ onOpen, onToggleFavorite, isFavorite }) {
  const list = loadRecent();
  document.getElementById("recentCard").classList.toggle("hidden", list.length === 0);

  document.getElementById("recentList").replaceChildren(
    ...list.map((entry) => {
      const saved = isFavorite(entry);
      return el("li", { className: "recent-item" }, [
        el("button", { className: "recent-open", title: "Show this translation", onclick: () => onOpen(entry) }, [
          el("span", { className: "recent-text", dir: "auto", text: entry.text }),
          el("span", { className: "recent-translation", dir: "auto", text: entry.translation }),
        ]),
        el("button", {
          className: "btn btn-ghost icon-btn",
          text: saved ? "⭐" : "☆",
          title: saved ? "Remove from favorites" : "Save to favorites",
          ariaLabel: `${saved ? "Remove from" : "Save to"} favorites: ${entry.text}`,
          ariaPressed: String(saved),
          onclick: () => onToggleFavorite(entry),
        }),
      ]);
    })
  );
}
