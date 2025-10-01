import { updatePracticeButton } from "./practice.js";

export function loadFavorites() {
  return JSON.parse(localStorage.getItem("favorites")) || [];
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
  list.innerHTML = "";

  const clearBtn = document.getElementById("clearFavoritesBtn");
  if (!clearBtn) return;

  if (favorites.length < 2) {
    clearBtn.classList.add("hidden");
  } else {
    clearBtn.classList.remove("hidden");
  }

  favorites.forEach((item) => {
    const li = document.createElement("li");

    // Add text content safely
    li.appendChild(document.createTextNode("📌 "));

    const strong = document.createElement("strong");
    strong.textContent = item.text;
    li.appendChild(strong);

    li.appendChild(document.createTextNode(` → ${item.translation}`));

    // Add remove button safely
    const removeBtn = document.createElement("button");
    removeBtn.textContent = "❌";
    removeBtn.addEventListener("click", () => removeFavoriteAndRender(item.id));
    li.appendChild(removeBtn);

    list.appendChild(li);
  });
  updatePracticeButton();
}
