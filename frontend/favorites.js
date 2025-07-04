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
    nextReview: null,
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
  if (favorites.length < 2) {
    clearBtn.classList.add("hidden");
  } else {
    clearBtn.classList.remove("hidden");
  }

  favorites.forEach((item) => {
    const li = document.createElement("li");
    li.innerHTML = `📌 <strong>${item.text}</strong> → ${item.translation}
      <button onclick="removeFavoriteAndRender('${item.id}')">❌</button>`;
    list.appendChild(li);
  });
}
