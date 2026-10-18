import { getJSON } from "./storage.js";
import { el } from "./dom.js";

export function loadFavorites() {
  return getJSON("favorites", []);
}

export function saveFavorites(favorites) {
  localStorage.setItem("favorites", JSON.stringify(favorites));
}

export function findFavorite(text) {
  const key = text.trim().toLowerCase();
  return loadFavorites().find((f) => f.text.trim().toLowerCase() === key);
}

// Returns false if the word is already saved.
export function addFavorite({ text, translation, pronunciation = "", langCode, sourceLang, detectedLanguage }) {
  if (findFavorite(text)) return false;
  const favorites = loadFavorites();
  favorites.push({
    id: crypto.randomUUID(),
    text,
    translation,
    pronunciation,
    langCode, // target language; with sourceLang/detectedLanguage lets the entry be reopened later
    sourceLang,
    detectedLanguage,
    addedAt: new Date().toISOString(),
    reviewed: 0, // consecutive correct answers
    nextReview: null, // null = due now
  });
  saveFavorites(favorites);
  return true;
}

// Returns what's needed to undo the removal: the item and where it was.
export function removeFavorite(id) {
  const favorites = loadFavorites();
  const index = favorites.findIndex((f) => f.id === id);
  if (index === -1) return null;
  const [item] = favorites.splice(index, 1);
  saveFavorites(favorites);
  return { item, index };
}

// Puts a removed favorite back in place, practice progress included.
export function restoreFavorite({ item, index }) {
  const favorites = loadFavorites();
  if (favorites.some((f) => f.id === item.id)) return;
  favorites.splice(Math.min(index, favorites.length), 0, item);
  saveFavorites(favorites);
}

export function clearFavorites() {
  localStorage.removeItem("favorites");
}

export function renderFavorites({ onOpen, onRemove }) {
  const favorites = loadFavorites();

  document
    .getElementById("clearFavoritesBtn")
    .classList.toggle("hidden", favorites.length < 2);
  document
    .getElementById("favoritesEmpty")
    .classList.toggle("hidden", favorites.length > 0);

  document.getElementById("favoritesList").replaceChildren(
    ...favorites.map((item) =>
      el("li", { className: "fav-item" }, [
        el("button", { className: "fav-open", title: "Show this translation", onclick: () => onOpen(item) }, [
          el("span", { className: "fav-text", dir: "auto", text: item.text }),
          el("span", { className: "fav-translation", dir: "auto", text: item.translation }),
          ...(item.pronunciation
            ? [el("span", { className: "pronunciation", text: item.pronunciation })]
            : []),
        ]),
        el("button", {
          className: "btn btn-ghost icon-btn",
          text: "✕",
          title: "Remove",
          ariaLabel: `Remove ${item.text}`,
          onclick: () => onRemove(item.id),
        }),
      ])
    )
  );
}
