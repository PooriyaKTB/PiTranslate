import { updatePracticeButton } from "./practice.js";
import { getJSON } from "./storage.js";

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
    reviewed: 0,
    nextReview: new Date(Date.now() - 1000).toISOString(),
  });
  saveFavorites(favorites);
}

export function removeFavorite(id) {
  const favorites = loadFavorites().filter((f) => f.id !== id);
  saveFavorites(favorites);
}

export function renderFavorites() {
  const favorites = loadFavorites();
  const list = document.getElementById("favoritesList");
  list.replaceChildren();

  const clearBtn = document.getElementById("clearFavoritesBtn");
  if (!clearBtn) return;

  if (favorites.length < 2) {
    clearBtn.classList.add("hidden");
  } else {
    clearBtn.classList.remove("hidden");
  }

  favorites.forEach((item) => {
    const li = document.createElement("li");

    li.appendChild(document.createTextNode("📌 "));

    const strong = document.createElement("strong");
    strong.textContent = item.text;
    li.appendChild(strong);

    li.appendChild(document.createTextNode(` → ${item.translation}`));

    const removeBtn = document.createElement("button");
    removeBtn.textContent = "❌";
    removeBtn.addEventListener("click", () => removeFavoriteAndRender(item.id));
    li.appendChild(removeBtn);

    list.appendChild(li);
  });
  updatePracticeButton();
}
