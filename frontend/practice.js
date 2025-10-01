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
  const dueBtn = document.getElementById("dueWordsBtn");
  const dueCount = document.getElementById("dueCount");
  const queue = JSON.parse(localStorage.getItem("practiceQueue") || "[]");
  const practiceStarted = localStorage.getItem("practiceStarted");
  const practiceIndex = parseInt(localStorage.getItem("practiceIndex")) || 0;

  // Update due count status line
  const dueItemsCount = getDueItems().length;
  if (dueCount) {
    dueCount.textContent = `✅ ${dueItemsCount} words are due today`;
    dueCount.style.color = "#28a745";
    dueCount.style.fontSize = "0.9rem";
    dueCount.style.margin = "0.5rem 0";
  }

  // Don't show buttons if practice has started (they should be hidden)
  if (practiceStarted) {
    btn.style.display = "none";
    if (dueBtn) dueBtn.style.display = "none";
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
      if (dueBtn) dueBtn.style.display = "inline-block";
      return;
    }
    // No favorites at all
    btn.style.display = "none";
    if (dueBtn) dueBtn.style.display = "none";
    localStorage.removeItem("practiceStarted");
    localStorage.removeItem("practiceIndex");
    return;
  }

  btn.style.display = "inline-block";
  btn.textContent = "▶️ Start Practice";
  if (dueBtn) dueBtn.style.display = "inline-block";
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
  // Reload favorites to get the most current data with updated review schedules
  const allFavorites = getAllFavorites();

  // Make practice area visible
  box.classList.remove("hidden");

  // Hide practice buttons when showing completion options
  const nextBtn = document.getElementById("nextPracticeBtn");
  const dueBtn = document.getElementById("dueWordsBtn");
  if (nextBtn) nextBtn.style.display = "none";
  if (dueBtn) dueBtn.style.display = "none";

  // Set the last practice date (update it every time practice is completed)
  setLastPracticeDate();

  // Clear the timer reset flag after practice completion
  localStorage.removeItem("timerWasReset");

  // Get last practice date for display
  const lastPracticeDate = getLastPracticeDate();
  const lastPracticeText = lastPracticeDate
    ? `Last practice: ${lastPracticeDate.toLocaleDateString()} at ${lastPracticeDate.toLocaleTimeString()}`
    : "";

  // Find the next scheduled review time (future items only)
  const nowTs = Date.now();
  const futureItems = allFavorites.filter(
    (item) => item.nextReview && new Date(item.nextReview).getTime() > nowTs
  );
  const nextReview = futureItems.sort(
    (a, b) => new Date(a.nextReview) - new Date(b.nextReview)
  )[0];

  const nextReviewText = nextReview
    ? `Next scheduled practice: ${new Date(
        nextReview.nextReview
      ).toLocaleDateString()}`
    : "No scheduled practice sessions";

  box.innerHTML = ""; // Clear existing content

  const containerDiv = document.createElement("div");
  containerDiv.style.cssText = "text-align: center; padding: 2rem;";

  // Title
  const title = document.createElement("h3");
  title.textContent = "🎉 Practice Complete!";
  containerDiv.appendChild(title);

  // Completion message
  const completionMsg = document.createElement("p");
  completionMsg.textContent = `You've finished practicing all ${allFavorites.length} words!`;
  containerDiv.appendChild(completionMsg);

  // Last practice date (if exists)
  if (lastPracticeText) {
    const lastPracticePara = document.createElement("p");
    lastPracticePara.style.cssText = "color: #28a745; font-weight: bold;";
    lastPracticePara.textContent = lastPracticeText;
    containerDiv.appendChild(lastPracticePara);
  }

  // Button container
  const buttonContainer = document.createElement("div");
  buttonContainer.style.cssText = "margin: 1.5rem 0;";

  const startAgainBtn = document.createElement("button");
  startAgainBtn.id = "startAgainBtn";
  startAgainBtn.textContent = "🔁 Start Practice Again";
  startAgainBtn.style.cssText =
    "margin: 0.5rem; padding: 0.8rem 1.5rem; background: #007bff; color: white; border: none; border-radius: 6px; cursor: pointer;";
  buttonContainer.appendChild(startAgainBtn);

  const resetTimerBtn = document.createElement("button");
  resetTimerBtn.id = "resetTimerBtn";
  resetTimerBtn.textContent = "⏰ Reset Next Practice Time";
  resetTimerBtn.style.cssText =
    "margin: 0.5rem; padding: 0.8rem 1.5rem; background: #ffc107; color: #212529; border: none; border-radius: 6px; cursor: pointer;";
  buttonContainer.appendChild(resetTimerBtn);

  containerDiv.appendChild(buttonContainer);

  // Next review text
  const nextReviewPara = document.createElement("p");
  nextReviewPara.style.cssText = "color: #666; font-size: 0.9rem;";
  nextReviewPara.textContent = nextReviewText;
  containerDiv.appendChild(nextReviewPara);

  box.appendChild(containerDiv);

  // Handle start practice again (no timer change)
  document.getElementById("startAgainBtn").onclick = () => {
    if (window.startPracticeAllWords) {
      window.startPracticeAllWords();
    }
  };

  // Handle reset timer
  document.getElementById("resetTimerBtn").onclick = () => {
    resetPracticeTimer();
    // Set flag to indicate timer was reset - this will allow scheduling in the next practice session
    localStorage.setItem("timerWasReset", "true");

    // Show confirmation message
    const box = document.getElementById("practiceArea");
    box.innerHTML = ""; // Clear existing content

    const containerDiv = document.createElement("div");
    containerDiv.style.cssText = "text-align: center; padding: 2rem;";

    const title = document.createElement("h3");
    title.textContent = "⏰ Timer Reset!";
    containerDiv.appendChild(title);

    const message = document.createElement("p");
    message.textContent =
      "Next practice times have been reset based on your current progress.";
    containerDiv.appendChild(message);

    const startBtn = document.createElement("button");
    startBtn.id = "startPracticeAfterReset";
    startBtn.textContent = "🔁 Start Practice";
    startBtn.style.cssText =
      "margin: 1rem; padding: 0.8rem 1.5rem; background: #28a745; color: white; border: none; border-radius: 6px; cursor: pointer;";
    containerDiv.appendChild(startBtn);

    box.appendChild(containerDiv);

    document.getElementById("startPracticeAfterReset").onclick = () => {
      if (window.startPracticeAllWords) {
        window.startPracticeAllWords();
      }
    };
  };
}

// Practice button initialization is handled in main.js
