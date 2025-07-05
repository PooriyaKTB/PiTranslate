import { loadFavorites, saveFavorites } from "./favorites.js";

export function getDueItems() {
  const now = Date.now();
  return loadFavorites().filter((item) => {
    return !item.nextReview || new Date(item.nextReview).getTime() <= now;
  });
}

export function updatePracticeButton() {
  const btn = document.getElementById("nextPracticeBtn");
  const started = localStorage.getItem("practiceStarted");
  const queue = JSON.parse(localStorage.getItem("practiceQueue") || "[]");

  if (!queue.length) {
    btn.style.display = "none";
    return;
  }

  btn.style.display = "inline-block";
  btn.textContent = started ? "Next Word" : "Start Practice";
}

/* function updatePracticeButton() {
  const btn = document.getElementById("nextPracticeBtn");
  if (!btn) return;

  const favorites = JSON.parse(localStorage.getItem("favorites")) || [];
  const dueItems = favorites.filter((item) => {
    return !item.nextReview || new Date(item.nextReview).getTime() <= Date.now();
  });
  
  const started = localStorage.getItem("practiceStarted") === "true";

  if (dueItems.length < 1) {
    btn.style.display = "none";
  } else {
    btn.style.display = "inline-block";
    btn.textContent = started ? "➡️ Next Word" : "▶️ Start Practice";
  }
} */

export function scheduleReview(item, knewIt) {
  const favorites = loadFavorites();
  const index = favorites.findIndex((f) => f.id === item.id);
  if (index === -1) return;

  const now = new Date();
  if (knewIt) {
    favorites[index].reviewed += 1;
    const interval = Math.pow(2, favorites[index].reviewed);
    favorites[index].nextReview = new Date(
      now.getTime() + interval * 24 * 60 * 60 * 1000
    ).toISOString();
  } else {
    favorites[index].reviewed = 0;
    favorites[index].nextReview = new Date(
      now.getTime() + 1 * 24 * 60 * 60 * 1000
    ).toISOString();
  }
  const remaining = favorites.filter((item) => {
    return (
      !item.nextReview || new Date(item.nextReview).getTime() <= Date.now()
    );
  });
  if (remaining.length === 0) {
    console.log("🎉 All practiced!");
  }

  saveFavorites(favorites);
}

window.addEventListener("DOMContentLoaded", () => {
  updatePracticeButton();
});
