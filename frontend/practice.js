import { loadFavorites, saveFavorites } from "./favorites.js";

export function getDueItems() {
  const now = Date.now();
  return loadFavorites().filter(item => {
    return !item.nextReview || new Date(item.nextReview).getTime() <= now;
  });
}

export function scheduleReview(item, knewIt) {
  const favorites = loadFavorites();
  const index = favorites.findIndex(f => f.id === item.id);
  if (index === -1) return;

  const now = new Date();
  if (knewIt) {
    favorites[index].reviewed += 1;
    const interval = Math.pow(2, favorites[index].reviewed);
    favorites[index].nextReview = new Date(now.getTime() + interval * 24 * 60 * 60 * 1000).toISOString();
  } else {
    favorites[index].reviewed = 0;
    favorites[index].nextReview = new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000).toISOString();
  }

  saveFavorites(favorites);
}