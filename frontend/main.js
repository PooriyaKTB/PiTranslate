import {
  addFavorite,
  renderFavorites,
  removeFavorite,
  saveFavorites,
  loadFavorites,
} from "./favorites.js";
import {
  getDueItems,
  scheduleReview,
  updatePracticeButton,
} from "./practice.js";

const API_BASE = "https://pooriya-pitranslate.hosting.codeyourfuture.io/api";

import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  signOut,
} from "https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js";
import { firebaseConfig } from "./firebaseConfig.js";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

onAuthStateChanged(auth, (user) => {
  const welcomeText = document.getElementById("userWelcome");
  const logoutBtn = document.getElementById("logoutBtn");
  const authLinks = document.getElementById("authLinks");

  if (user) {
    welcomeText.textContent = `👋 Welcome, ${user.displayName || user.email}`;
    logoutBtn.style.display = "inline-block";
    logoutBtn.onclick = () =>
      signOut(auth).then(() => (window.location.href = "index.html"));
    if (authLinks) authLinks.style.display = "none";
  } else {
    welcomeText.textContent = "👋 Welcome, you are in as a guest";
    logoutBtn.style.display = "none";
    if (authLinks) authLinks.style.display = "block";
    else window.location.href = "index.html";
  }
});

let practiceQueue = [];
let practiceIndex = 0;

window.removeFavoriteAndRender = (id) => {
  removeFavorite(id);
  renderFavorites();
  buildPracticeQueue();
  updatePracticeButton();
};

function buildPracticeQueue() {
  const dueItems = getDueItems().sort(
    (a, b) => new Date(a.nextReview || 0) - new Date(b.nextReview || 0)
  );
  localStorage.setItem("practiceQueue", JSON.stringify(dueItems));
  // localStorage.setItem("practiceIndex", "0");
  updatePracticeButton();
  return dueItems;
}

function resetPractice() {
  const favorites = loadFavorites();
  favorites.forEach((f) => {
    f.reviewed = 0;
    f.nextReview = new Date(Date.now() - 1000).toISOString();
  });
  saveFavorites(favorites);

  localStorage.removeItem("practiceStarted");
  localStorage.removeItem("practiceIndex");
  localStorage.removeItem("practiceQueue");
  document.getElementById("practiceArea").innerHTML = "";
  practiceQueue = buildPracticeQueue();
  updatePracticeButton();
  document.getElementById("nextPracticeBtn").textContent = "Start Practice";
  document.getElementById("nextPracticeBtn").style.display = "inline-block";
}

document.getElementById("translateBtn").addEventListener("click", async () => {
  const inputText = document.getElementById("inputText").value;
  const targetLang = document.getElementById("targetLang").value;
  document.getElementById("output").textContent = "";
  document.getElementById("highlightTranslation").innerHTML = "";
  document.getElementById("extraDetails").innerHTML = "";
  document.getElementById("idiomOutput").innerHTML = "";

  if (!inputText.trim()) {
    document.getElementById("output").innerText =
      "Please enter text to translate.";
    return;
  }

  const res = await fetch(`${API_BASE}/translate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ inputText, targetLang }),
  });

  const data = await res.json();
  document.getElementById("output").textContent =
    data.translation || "Translation failed";
});

let availableVoices = [];

speechSynthesis.onvoiceschanged = () => {
  availableVoices = speechSynthesis.getVoices();
};

document.getElementById("speakBtn").addEventListener("click", () => {
  const text = document.getElementById("output").textContent;
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = document.getElementById("targetLang").value;

  const voice = availableVoices.find((v) => v.lang === utterance.lang);
  if (voice) utterance.voice = voice;

  speechSynthesis.speak(utterance);
});

document.getElementById("detailsBtn").addEventListener("click", async () => {
  const inputText = document.getElementById("inputText").value;
  const targetLang = document.getElementById("targetLang").value;

  if (!inputText.trim()) {
    document.getElementById("extraDetails").innerHTML =
      "<p style='color: red;'>Please enter a word or phrase first!</p>";
    return;
  }

  const res = await fetch(`${API_BASE}/details`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ inputText, targetLang }),
  });

  const data = await res.json();

  const examplesText = Array.isArray(data.examples)
    ? data.examples
        .map((ex) => `${ex?.text || ""} → ${ex?.translation || ""}`)
        .join("<br>")
    : "No examples available.";

  const synonymsText = Array.isArray(data.synonyms)
    ? data.synonyms
        .map((s) => `${s?.word || ""} → ${s?.translation || ""}`)
        .join("<br>")
    : "No synonyms available.";

  document.getElementById("extraDetails").innerHTML = `
    <h4>Examples:</h4><p>${examplesText}</p>
    <h4>Synonyms:</h4><p>${synonymsText}</p>
  `;
});

document.getElementById("idiomBtn").addEventListener("click", async () => {
  const inputText = document.getElementById("inputText").value;
  const targetLang = document.getElementById("targetLang").value;

  if (!inputText.trim()) {
    document.getElementById("idiomOutput").innerHTML =
      "<p style='color: red;'>Please enter a word or phrase first.</p>";
    return;
  }

  const res = await fetch(`${API_BASE}/idiom`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ inputText, targetLang, inputLang: "auto" }),
  });

  const data = await res.json();

  document.getElementById("idiomOutput").innerHTML = `
    <h4>📌 Idiom:</h4><p>${data.idiom}</p>
    <h4>💬 Meaning:</h4><p>${data.meaning}</p>
    <h4>🌍 Equivalent in ${targetLang}:</h4><p>${data.equivalent}</p>
  `;
});

document.getElementById("favBtn").addEventListener("click", () => {
  const inputText = document.getElementById("inputText").value;
  const translation = document.getElementById("output").textContent;
  if (!inputText || !translation) return;
  addFavorite({ text: inputText, translation });
  renderFavorites();
  buildPracticeQueue();
  updatePracticeButton();
});

document.getElementById("nextPracticeBtn").addEventListener("click", () => {
  if (!localStorage.getItem("practiceStarted")) {
    localStorage.setItem("practiceStarted", "true");
    practiceIndex = 0;
    localStorage.setItem("practiceIndex", "0");
    practiceQueue = buildPracticeQueue();
    updatePracticeButton();
  } else {
    practiceQueue = JSON.parse(localStorage.getItem("practiceQueue")) || [];
    practiceIndex = parseInt(localStorage.getItem("practiceIndex")) || 0;
    practiceIndex++;
    localStorage.setItem("practiceIndex", practiceIndex);
  }

  const box = document.getElementById("practiceArea");

  if (practiceQueue.length === 0) {
    box.innerHTML = `<p>No words due for practice.</p>`;
    return;
  }

  if (practiceIndex >= practiceQueue.length) {
    document.getElementById("nextPracticeBtn").style.display = "none";
    box.innerHTML = `
      <p>🎉 Well done! You practiced all words.</p>
      <button id="restartBtn">🔁 Restart Practice</button>
    `;
    document.getElementById("restartBtn").onclick = () => {
      resetPractice();
      setTimeout(() => document.getElementById("nextPracticeBtn").click(), 100);
    };
    return;
  }

  const item = practiceQueue[practiceIndex];

  box.innerHTML = `
    <p><strong>Translate this:</strong> ${item.text}</p>
    <details id="answerDetails">
      <summary>Show Answer</summary>
      <p>${item.translation}</p>
      <div id="feedbackButtons" style="margin-top: 10px; display: none;">
        <button id="knewBtn">✅ I knew it</button>
        <button id="didntBtn">❌ I didn't</button>
      </div>
    </details>
  `;

  document
    .querySelector("#answerDetails")
    .addEventListener("toggle", function () {
      const btns = document.getElementById("feedbackButtons");
      if (this.open) btns.style.display = "block";
    });

  document.getElementById("knewBtn").onclick = () => {
    scheduleReview(item, true);
    setTimeout(() => document.getElementById("nextPracticeBtn").click(), 500);
  };

  document.getElementById("didntBtn").onclick = () => {
    scheduleReview(item, false);
    setTimeout(() => document.getElementById("nextPracticeBtn").click(), 500);
  };
});

document.getElementById("themeToggle").addEventListener("click", () => {
  const html = document.documentElement;
  const current = html.getAttribute("data-theme");
  const next = current === "dark" ? "light" : "dark";
  html.setAttribute("data-theme", next);
  localStorage.setItem("theme", next);
});

const modal = document.getElementById("clearModal");
const confirmBtn = document.getElementById("confirmClearBtn");
const cancelBtn = document.getElementById("cancelClearBtn");
const checkbox = document.getElementById("skipConfirmCheckbox");

function clearFavoritesNow() {
  localStorage.removeItem("favorites");
  localStorage.removeItem("practiceIndex");
  localStorage.removeItem("practiceStarted");
  localStorage.removeItem("practiceQueue");
  renderFavorites();
  document.getElementById("practiceArea").innerHTML = "";
  updatePracticeButton();
  document.getElementById("nextPracticeBtn").textContent = "Start Practice";
  document.getElementById("nextPracticeBtn").style.display = "inline-block";
  modal.classList.add("hidden");
}

document.getElementById("clearFavoritesBtn").addEventListener("click", () => {
  if (localStorage.getItem("skipDeleteConfirm") === "true") {
    clearFavoritesNow();
  } else {
    modal.classList.remove("hidden");
  }
});

confirmBtn?.addEventListener("click", () => {
  if (checkbox.checked) {
    localStorage.setItem("skipDeleteConfirm", "true");
  }
  clearFavoritesNow();
});

cancelBtn?.addEventListener("click", () => {
  modal.classList.add("hidden");
});

window.addEventListener("DOMContentLoaded", () => {
  const savedTheme = localStorage.getItem("theme") || "light";
  document.documentElement.setAttribute("data-theme", savedTheme);
  renderFavorites();
  updatePracticeButton();
});

document.addEventListener("mouseup", async () => {
  const selected = window.getSelection().toString().trim();
  const targetLang = document.getElementById("targetLang").value;

  if (selected.length < 1) return;

  const res = await fetch(`${API_BASE}/translate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ inputText: selected, targetLang }),
  });

  const data = await res.json();
  const box = document.getElementById("highlightTranslation");
  box.innerHTML = `<p><strong>${selected}</strong> → ${data.translation}</p>`;
});
