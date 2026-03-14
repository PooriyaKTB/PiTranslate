import { loadFavorites, saveFavorites } from "./favorites.js";

// Fisher-Yates shuffle for unbiased randomization
export function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

export function getAllFavorites() {
  return loadFavorites();
}

export function getDueItems() {
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

  const allFavorites = getAllFavorites();
  const dueItemsCount = getDueItems().length;

  if (dueCount) {
    if (allFavorites.length > 0) {
      dueCount.textContent = `✅ ${dueItemsCount} words are due today`;
      dueCount.style.color = "#28a745";
      dueCount.style.fontSize = "0.9rem";
      dueCount.style.margin = "0.5rem 0";
      dueCount.style.display = "block";
    } else {
      dueCount.style.display = "none";
    }
  }

  if (practiceStarted) {
    btn.style.display = "none";
    if (dueBtn) dueBtn.style.display = "none";
    return;
  }

  if (!queue.length) {
    if (allFavorites.length > 0) {
      const shuffled = shuffleArray([...allFavorites]);
      localStorage.setItem("practiceQueue", JSON.stringify(shuffled));
      btn.style.display = "inline-block";
      btn.textContent = "▶️ Start Practice";
      if (dueBtn) dueBtn.style.display = "inline-block";
      return;
    }
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

  const currentQueue = JSON.parse(
    localStorage.getItem("practiceQueue") || "[]"
  );
  const updatedQueue = currentQueue.map((queueItem) => {
    if (queueItem.id === item.id) {
      return favorites[index];
    }
    return queueItem;
  });
  localStorage.setItem("practiceQueue", JSON.stringify(updatedQueue));
}

export function resetPracticeTimer() {
  const favorites = loadFavorites();
  const now = new Date();

  favorites.forEach((favorite) => {
    if (favorite.reviewed > 0) {
      const interval = Math.pow(2, favorite.reviewed);
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

  box.classList.remove("hidden");

  const nextBtn = document.getElementById("nextPracticeBtn");
  const dueBtn = document.getElementById("dueWordsBtn");
  if (nextBtn) nextBtn.style.display = "none";
  if (dueBtn) dueBtn.style.display = "none";

  setLastPracticeDate();

  localStorage.removeItem("timerWasReset");

  const lastPracticeDate = getLastPracticeDate();
  const lastPracticeText = lastPracticeDate
    ? `Last practice: ${lastPracticeDate.toLocaleDateString()} at ${lastPracticeDate.toLocaleTimeString()}`
    : "";

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

  box.replaceChildren();

  const containerDiv = document.createElement("div");
  containerDiv.className = "practice-completion";

  const title = document.createElement("h3");
  title.textContent = "🎉 Practice Complete!";
  containerDiv.appendChild(title);

  const completionMsg = document.createElement("p");
  completionMsg.textContent = `You've finished practicing all ${allFavorites.length} words!`;
  containerDiv.appendChild(completionMsg);

  if (lastPracticeText) {
    const lastPracticePara = document.createElement("p");
    lastPracticePara.className = "last-practice";
    lastPracticePara.textContent = lastPracticeText;
    containerDiv.appendChild(lastPracticePara);
  }

  const buttonContainer = document.createElement("div");
  buttonContainer.style.margin = "1.5rem 0";

  const startAgainBtn = document.createElement("button");
  startAgainBtn.id = "startAgainBtn";
  startAgainBtn.className = "practice-btn-start";
  startAgainBtn.textContent = "🔁 Start Practice Again";
  buttonContainer.appendChild(startAgainBtn);

  const resetTimerBtn = document.createElement("button");
  resetTimerBtn.id = "resetTimerBtn";
  resetTimerBtn.className = "practice-btn-reset";
  resetTimerBtn.textContent = "⏰ Reset Next Practice Time";
  buttonContainer.appendChild(resetTimerBtn);

  containerDiv.appendChild(buttonContainer);

  const nextReviewPara = document.createElement("p");
  nextReviewPara.className = "next-review";
  nextReviewPara.textContent = nextReviewText;
  containerDiv.appendChild(nextReviewPara);

  box.appendChild(containerDiv);

  document.getElementById("startAgainBtn").onclick = () => {
    if (window.startPracticeAllWords) {
      window.startPracticeAllWords();
    }
  };

  document.getElementById("resetTimerBtn").onclick = () => {
    resetPracticeTimer();
    localStorage.setItem("timerWasReset", "true");

    box.replaceChildren();

    const resetContainer = document.createElement("div");
    resetContainer.className = "practice-completion";

    const resetTitle = document.createElement("h3");
    resetTitle.textContent = "⏰ Timer Reset!";
    resetContainer.appendChild(resetTitle);

    const message = document.createElement("p");
    message.textContent =
      "Next practice times have been reset based on your current progress.";
    resetContainer.appendChild(message);

    const startBtn = document.createElement("button");
    startBtn.id = "startPracticeAfterReset";
    startBtn.className = "practice-btn-after-reset";
    startBtn.textContent = "🔁 Start Practice";
    resetContainer.appendChild(startBtn);

    box.appendChild(resetContainer);

    document.getElementById("startPracticeAfterReset").onclick = () => {
      if (window.startPracticeAllWords) {
        window.startPracticeAllWords();
      }
    };
  };
}
