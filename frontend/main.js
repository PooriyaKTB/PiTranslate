import { addFavorite, renderFavorites, removeFavorite } from "./favorites.js";
import {
  getDueItems,
  scheduleReview,
  updatePracticeButton,
} from "./practice.js";

const API_BASE = "https://pooriya-pitranslate.hosting.codeyourfuture.io/api";

window.removeFavoriteAndRender = (id) => {
  removeFavorite(id);
  renderFavorites();
  const currentQueue = JSON.parse(localStorage.getItem("practiceQueue")) || [];
  const updatedIndex = parseInt(localStorage.getItem("practiceIndex")) || 0;
  if (updatedIndex >= updatedQueue.length) {
    localStorage.setItem("practiceIndex", "0");
  }
  localStorage.setItem("practiceQueue", JSON.stringify(updatedQueue));
  updatePracticeButton();
};

document.getElementById("translateBtn").addEventListener("click", async () => {
  const inputText = document.getElementById("inputText").value;
  const targetLang = document.getElementById("targetLang").value;

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

document.getElementById("speakBtn").addEventListener("click", () => {
  const text = document.getElementById("output").textContent;
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = document.getElementById("targetLang").value;
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
  updatePracticeButton();
});

function buildPracticeQueue() {
  // const practiceQueue = JSON.parse(localStorage.getItem("practiceQueue")) || [];
  // let practiceIndex = parseInt(localStorage.getItem("practiceIndex")) || 0;
  const dueItems = getDueItems().sort(
    (a, b) => new Date(a.nextReview || 0) - new Date(b.nextReview || 0)
  );
  localStorage.setItem("practiceQueue", JSON.stringify(dueItems));
  localStorage.setItem("practiceIndex", "0");
  updatePracticeButton();
  return dueItems;
}

let practiceIndex = 0;
let practiceQueue = [];

document.getElementById("nextPracticeBtn").addEventListener("click", () => {
  if (!localStorage.getItem("practiceStarted")) {
    localStorage.setItem("practiceStarted", "true");
    updatePracticeButton();
    practiceIndex = 0;
    practiceQueue = buildPracticeQueue();
    localStorage.setItem("practiceIndex", 0);
  } else {
    practiceQueue = JSON.parse(localStorage.getItem("practiceQueue")) || [];
    practiceIndex = parseInt(localStorage.getItem("practiceIndex")) || 0;
  }

  const box = document.getElementById("practiceArea");

  if (practiceIndex >= practiceQueue.length) {
    box.innerHTML = `
      <p>🎉 Well done! You practiced all words.</p>
      <button id="restartBtn">🔁 Restart Practice</button>
    `;
    document.getElementById("restartBtn").onclick = () => {
      localStorage.removeItem("practiceStarted");
      localStorage.removeItem("practiceIndex");
      localStorage.removeItem("practiceQueue");
      updatePracticeButton();
      document.getElementById("practiceArea").innerHTML = "";
      setTimeout(() => {
        localStorage.setItem("practiceStarted", "true");
        document.getElementById("nextPracticeBtn").click();
      }, 200);

      localStorage.removeItem("practiceStarted");
      localStorage.removeItem("practiceIndex");
      localStorage.removeItem("practiceQueue");
      updatePracticeButton();
      document.getElementById("practiceArea").innerHTML = "";
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
    practiceIndex++;
    localStorage.setItem("practiceIndex", 0);
    setTimeout(() => document.getElementById("nextPracticeBtn").click(), 500);
  };

  document.getElementById("didntBtn").onclick = () => {
    scheduleReview(item, false);
    practiceIndex++;
    localStorage.setItem("practiceIndex", 0);
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

window.addEventListener("DOMContentLoaded", () => {
  const savedTheme = localStorage.getItem("theme") || "light";
  document.documentElement.setAttribute("data-theme", savedTheme);
  renderFavorites();
  updatePracticeButton();
});

const modal = document.getElementById("clearModal");
const confirmBtn = document.getElementById("confirmClearBtn");
const cancelBtn = document.getElementById("cancelClearBtn");
const checkbox = document.getElementById("skipConfirmCheckbox");

document.getElementById("clearFavoritesBtn").addEventListener("click", () => {
  if (localStorage.getItem("skipDeleteConfirm") === "true") {
    clearFavoritesNow();
    modal.classList.add("hidden");
  } else {
    modal.classList.remove("hidden");
  }
});

confirmBtn.addEventListener("click", () => {
  if (checkbox.checked) {
    localStorage.setItem("skipDeleteConfirm", "true");
  }
  clearFavoritesNow();
  modal.classList.add("hidden");
});

cancelBtn.addEventListener("click", () => {
  modal.classList.add("hidden");
});

function clearFavoritesNow() {
  localStorage.removeItem("favorites");
  localStorage.removeItem("practiceIndex");
  localStorage.removeItem("practiceStarted");
  localStorage.removeItem("practiceQueue");
  renderFavorites();
  document.getElementById("practiceArea").innerHTML = "";
  updatePracticeButton();
  document.getElementById("clearModal").style.display = "none";
  document.getElementById("nextPracticeBtn").textContent = "Start Practice";
}
