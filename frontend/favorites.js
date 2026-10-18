import { getJSON } from "./storage.js";
import { el } from "./dom.js";

export function loadFavorites() {
  return getJSON("favorites", []);
}

export function saveFavorites(favorites) {
  localStorage.setItem("favorites", JSON.stringify(favorites));
}

export function addFavorite({ text, translation }) {
  const favorites = loadFavorites();
  const exists = favorites.some(
    (f) => f.text.trim().toLowerCase() === text.trim().toLowerCase()
  );
  if (exists) return;
  favorites.push({
    id: crypto.randomUUID(),
    text,
    translation,
    addedAt: new Date().toISOString(),
    reviewed: 0, // consecutive correct answers
    nextReview: null, // null = due now
  });
  saveFavorites(favorites);
}

export function removeFavorite(id) {
  saveFavorites(loadFavorites().filter((f) => f.id !== id));
}

export function clearFavorites() {
  localStorage.removeItem("favorites");
}

export function renderFavorites(onRemove) {
  const favorites = loadFavorites();

  document
    .getElementById("clearFavoritesBtn")
    .classList.toggle("hidden", favorites.length < 2);

  document.getElementById("favoritesList").replaceChildren(
    ...favorites.map((item) =>
      el("li", {}, [
        "📌 ",
        el("strong", { text: item.text }),
        ` → ${item.translation}`,
        el("button", { text: "❌", onclick: () => onRemove(item.id) }),
      ])
    )
  );
}
