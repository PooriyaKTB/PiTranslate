import { addFavorite, renderFavorites, removeFavorite } from "./favorites.js";
import { getDueItems, scheduleReview } from "./practice.js";

const API_BASE = "https://pooriya-pitranslate.hosting.codeyourfuture.io/api";

window.removeFavoriteAndRender = (id) => {
  removeFavorite(id);
  renderFavorites();
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

document.getElementById("nextPracticeBtn").addEventListener("click", () => {
  const dueItems = getDueItems();
  const box = document.getElementById("practiceArea");
  if (dueItems.length === 0) {
    box.innerHTML = `
      <p>🎉 Well done! You practiced all words.</p>
      <button id="restartBtn">🔁 Restart Practice</button>
    `;
    document.getElementById("restartBtn").onclick = () => {
      updatePracticeButton();
      document.getElementById("nextPracticeBtn").click();
    };
  return;
  }

  const sorted = dueItems.sort(
    (a, b) => new Date(a.nextReview || 0) - new Date(b.nextReview || 0)
  );
  const item = sorted[0];

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

  document.querySelector("#answerDetails").addEventListener("toggle", function () {
    const btns = document.getElementById("feedbackButtons");
    if (this.open) btns.style.display = "block";
  });

  document.getElementById("knewBtn").onclick = () => {
    scheduleReview(item, true);
    box.innerHTML = "<p>✅ Great! It will show up less frequently.</p>";
    setTimeout(() => document.getElementById("nextPracticeBtn").click(), 1000);
  };
  document.getElementById("didntBtn").onclick = () => {
    scheduleReview(item, false);
    box.innerHTML = "<p>❌ No problem! We'll repeat it sooner.</p>";
    setTimeout(() => document.getElementById("nextPracticeBtn").click(), 1000);
  };
});

function updatePracticeButton() {
  const btn = document.getElementById("nextPracticeBtn");
  if (!btn) return;

  const favorites = JSON.parse(localStorage.getItem("favorites")) || [];
  const dueItems = favorites.filter((item) => {
    return !item.nextReview || new Date(item.nextReview).getTime() <= Date.now();
  });

  if (dueItems.length < 1) {
    btn.style.display = "none";
  } else {
    btn.style.display = "inline-block";
    btn.textContent = dueItems.length === 1 ? "▶️ Start Practice" : "➡️ Next Word";
  }
}

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
  renderFavorites();
  updatePracticeButton();
  document.getElementById("practiceArea").innerHTML = "";
}
