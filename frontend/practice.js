import { loadFavorites, saveFavorites } from "./favorites.js";

export function getAllFavorites() {
  // Return all favorites for practice, regardless of review status
  return loadFavorites();
}

export function getDueItems() {
  // Return only items that are actually due for review (for scheduling purposes)
  const now = Date.now();
  return loadFavorites().filter((item) => {
    return !item.nextReview || new Date(item.nextReview).getTime() <= now;
  });
}

export function updatePracticeButton() {
  const btn = document.getElementById("nextPracticeBtn");
  const queue = JSON.parse(localStorage.getItem("practiceQueue") || "[]");
  const practiceStarted = localStorage.getItem("practiceStarted");
  const practiceIndex = parseInt(localStorage.getItem("practiceIndex")) || 0;

  // Don't show button if practice has started (it should be hidden)
  if (practiceStarted) {
    btn.style.display = "none";
    return;
  }

  if (!queue.length) {
    const allFavorites = getAllFavorites(); // All favorites available for practice
    if (allFavorites.length > 0) {
      // Randomize the queue each time
      const shuffledFavorites = [...allFavorites].sort(
        () => Math.random() - 0.5
      );
      localStorage.setItem("practiceQueue", JSON.stringify(shuffledFavorites));
      btn.style.display = "inline-block";
      btn.textContent = "▶️ Start Practice";
      return;
    }
    // No favorites at all
    btn.style.display = "none";
    localStorage.removeItem("practiceStarted");
    localStorage.removeItem("practiceIndex");
    return;
  }

  btn.style.display = "inline-block";
  btn.textContent = "▶️ Start Practice";
}

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

  saveFavorites(favorites);
}

export function resetPracticeTimer() {
  const favorites = loadFavorites();
  const now = new Date();

  favorites.forEach((favorite) => {
    if (favorite.reviewed > 0) {
      // Calculate the interval based on current review count
      const interval = Math.pow(2, favorite.reviewed);
      // Set next review to be the same interval from now
      favorite.nextReview = new Date(
        now.getTime() + interval * 24 * 60 * 60 * 1000
      ).toISOString();
    }
  });

  saveFavorites(favorites);
}

export function setLastPracticeDate() {
  const now = new Date();
  localStorage.setItem("lastPracticeDate", now.toISOString());
}

export function getLastPracticeDate() {
  const lastPractice = localStorage.getItem("lastPracticeDate");
  return lastPractice ? new Date(lastPractice) : null;
}

export function showPracticeCompletionOptions() {
  const box = document.getElementById("practiceArea");
  const allFavorites = getAllFavorites();

  // Make practice area visible
  box.classList.remove("hidden");

  // Set the last practice date (update it every time practice is completed)
  setLastPracticeDate();

  // Get last practice date for display
  const lastPracticeDate = getLastPracticeDate();
  const lastPracticeText = lastPracticeDate
    ? `Last practice: ${lastPracticeDate.toLocaleDateString()} at ${lastPracticeDate.toLocaleTimeString()}`
    : "";

  // Find the next scheduled review time
  const nextReview = allFavorites
    .filter((item) => item.nextReview)
    .sort((a, b) => new Date(a.nextReview) - new Date(b.nextReview))[0];

  const nextReviewText = nextReview
    ? `Next scheduled practice: ${new Date(
        nextReview.nextReview
      ).toLocaleDateString()}`
    : "No scheduled practice sessions";

  box.innerHTML = `
    <div style="text-align: center; padding: 2rem;">
      <h3>🎉 Practice Complete!</h3>
      <p>You've finished practicing all ${allFavorites.length} words!</p>
      ${
        lastPracticeText
          ? `<p style="color: #28a745; font-weight: bold;">${lastPracticeText}</p>`
          : ""
      }
      <div style="margin: 1.5rem 0;">
        <button id="startAgainBtn" style="margin: 0.5rem; padding: 0.8rem 1.5rem; background: #007bff; color: white; border: none; border-radius: 6px; cursor: pointer;">
          🔁 Start Practice Again
        </button>
        <button id="resetTimerBtn" style="margin: 0.5rem; padding: 0.8rem 1.5rem; background: #ffc107; color: #212529; border: none; border-radius: 6px; cursor: pointer;">
          ⏰ Reset Next Practice Time
        </button>
      </div>
      <p style="color: #666; font-size: 0.9rem;">
        ${nextReviewText}
      </p>
    </div>
  `;

  // Handle start practice again (no timer change)
  document.getElementById("startAgainBtn").onclick = () => {
    if (window.startPracticeAllWords) {
      window.startPracticeAllWords();
    }
  };

  // Handle reset timer
  document.getElementById("resetTimerBtn").onclick = () => {
    resetPracticeTimer();
    // Show confirmation message
    const box = document.getElementById("practiceArea");
    box.innerHTML = `
      <div style="text-align: center; padding: 2rem;">
        <h3>⏰ Timer Reset!</h3>
        <p>Next practice times have been reset based on your current progress.</p>
        <button id="startPracticeAfterReset" style="margin: 1rem; padding: 0.8rem 1.5rem; background: #28a745; color: white; border: none; border-radius: 6px; cursor: pointer;">
          🔁 Start Practice
        </button>
      </div>
    `;

    document.getElementById("startPracticeAfterReset").onclick = () => {
      if (window.startPracticeAllWords) {
        window.startPracticeAllWords();
      }
    };
  };
}

// Practice button initialization is handled in main.js
