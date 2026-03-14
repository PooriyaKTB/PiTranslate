import {
  addFavorite,
  renderFavorites,
  removeFavorite,
  saveFavorites,
  loadFavorites,
} from "./favorites.js";
import {
  getDueItems,
  getAllFavorites,
  scheduleReview,
  updatePracticeButton,
  showPracticeCompletionOptions,
  resetPracticeTimer,
  setLastPracticeDate,
  getLastPracticeDate,
  shuffleArray,
} from "./practice.js";

const API_BASE = "https://pooriya-pitranslate.hosting.codeyourfuture.io/api";

const LANG_NAMES = {
  "fr-FR": "French",
  "de-DE": "German",
  "fa-IR": "Persian",
  "ar-SA": "Arabic",
  "zh-CN": "Chinese",
  "ja-JP": "Japanese",
  "es-ES": "Spanish",
  "ru-RU": "Russian",
  "en-GB": "English",
  "en-US": "English",
};

function getLangName(code) {
  return LANG_NAMES[code] || code;
}

async function apiCall(
  endpoint,
  payload,
  { buttonEl, spinnerEl, timeoutMs = 15000 } = {}
) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    if (buttonEl) buttonEl.setAttribute("disabled", "true");
    if (spinnerEl) spinnerEl.classList.remove("hidden");

    const res = await fetch(`${API_BASE}/${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    }

    return await res.json();
  } catch (error) {
    clearTimeout(timeoutId);
    showFeedbackPopup("Request failed. Please try again.", "warning");
    return null;
  } finally {
    if (buttonEl) buttonEl.removeAttribute("disabled");
    if (spinnerEl) spinnerEl.classList.add("hidden");
  }
}

function ensureInlineSpinner(afterEl, id) {
  let sp = document.getElementById(id);
  if (!sp) {
    sp = document.createElement("span");
    sp.id = id;
    sp.className = "spinner hidden";
    sp.textContent = " Loading…";
    afterEl.insertAdjacentElement("afterend", sp);
  }
  return sp;
}

import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  signOut,
} from "https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js";
import { firebaseConfig } from "./firebaseConfig.js";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

document.addEventListener("DOMContentLoaded", () => {
  const detailSections = [
    "output",
    "highlightTranslation",
    "extraDetails",
    "idiomOutput",
    "practiceArea",
  ];
  detailSections.forEach((id) => {
    const element = document.getElementById(id);
    if (element) element.classList.add("hidden");
  });

  const savedTheme = localStorage.getItem("theme") || "light";
  document.documentElement.setAttribute("data-theme", savedTheme);
  renderFavorites();

  const lastPracticeDate = getLastPracticeDate();
  const practiceStarted = localStorage.getItem("practiceStarted");

  if (lastPracticeDate && !practiceStarted) {
    showPracticeCompletionOptions();
    document.getElementById("nextPracticeBtn").style.display = "none";
  } else {
    updatePracticeButton();
  }
});

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

let practiceInTransition = false;
let practiceAdvanceTimerId = null;

window.removeFavoriteAndRender = (id) => {
  removeFavorite(id);
  renderFavorites();
  buildPracticeQueue();
  updatePracticeButton();
};

function buildPracticeQueue() {
  const allFavorites = getAllFavorites();
  const shuffled = shuffleArray([...allFavorites]);
  localStorage.setItem("practiceQueue", JSON.stringify(shuffled));
  updatePracticeButton();
  return shuffled;
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
  document.getElementById("practiceArea").replaceChildren();
  practiceQueue = buildPracticeQueue();
  updatePracticeButton();
  document.getElementById("nextPracticeBtn").textContent = "Start Practice";
  document.getElementById("nextPracticeBtn").style.display = "inline-block";
}

function startPracticeAllWords() {
  const allFavorites = loadFavorites();
  const shuffled = shuffleArray([...allFavorites]);
  localStorage.setItem("practiceQueue", JSON.stringify(shuffled));
  localStorage.setItem("practiceIndex", "0");
  localStorage.setItem("practiceStarted", "true");
  document.getElementById("practiceArea").classList.add("hidden");
  updatePracticeButton();

  practiceQueue = shuffled;
  practiceIndex = 0;
  showCurrentPracticeWord();
}

function startPracticeDueWords() {
  const dueItems = getDueItems();

  if (dueItems.length === 0) {
    showFeedbackPopup(
      "No due words right now. You can still practice all words.",
      "warning"
    );
    return;
  }

  const shuffled = shuffleArray([...dueItems]);
  localStorage.setItem("practiceQueue", JSON.stringify(shuffled));
  localStorage.setItem("practiceIndex", "0");
  localStorage.setItem("practiceStarted", "true");
  document.getElementById("practiceArea").classList.add("hidden");
  updatePracticeButton();

  practiceQueue = shuffled;
  practiceIndex = 0;
  showCurrentPracticeWord();
}

function showFeedbackPopup(message, type) {
  const existingPopup = document.getElementById("feedbackPopup");
  if (existingPopup) existingPopup.remove();

  const popup = document.createElement("div");
  popup.id = "feedbackPopup";
  popup.className = `feedback-popup ${type}`;
  popup.textContent = message;

  document.body.appendChild(popup);

  setTimeout(() => {
    if (popup.parentNode) popup.remove();
  }, 2000);
}

function showCurrentPracticeWord() {
  const box = document.getElementById("practiceArea");
  box.classList.remove("hidden");

  if (practiceQueue.length === 0) {
    showPracticeCompletionOptions();
    localStorage.removeItem("practiceStarted");
    localStorage.removeItem("practiceIndex");
    return;
  }

  if (practiceIndex >= practiceQueue.length) {
    setTimeout(() => {
      showPracticeCompletionOptions();
      localStorage.removeItem("practiceStarted");
      localStorage.removeItem("practiceIndex");
    }, 100);
    return;
  }

  const item = practiceQueue[practiceIndex];

  box.replaceChildren();

  practiceInTransition = false;
  if (practiceAdvanceTimerId) {
    clearTimeout(practiceAdvanceTimerId);
    practiceAdvanceTimerId = null;
  }

  const navDiv = document.createElement("div");
  navDiv.className = "practice-nav";

  const prevBtn = document.createElement("button");
  prevBtn.id = "prevWordBtn";
  prevBtn.className = "practice-btn-prev";
  prevBtn.textContent = "← Previous";
  if (practiceIndex === 0) prevBtn.disabled = true;
  navDiv.appendChild(prevBtn);

  const counterSpan = document.createElement("span");
  counterSpan.className = "counter";
  counterSpan.textContent = `${practiceIndex + 1} / ${practiceQueue.length}`;
  navDiv.appendChild(counterSpan);

  const nextBtn = document.createElement("button");
  nextBtn.id = "nextWordBtn";
  nextBtn.className = "practice-btn-next";
  nextBtn.textContent = "Next →";
  navDiv.appendChild(nextBtn);

  box.appendChild(navDiv);

  const questionPara = document.createElement("p");
  const questionStrong = document.createElement("strong");
  questionStrong.textContent = "Translate this: ";
  questionPara.appendChild(questionStrong);
  questionPara.appendChild(document.createTextNode(item.text));
  box.appendChild(questionPara);

  const details = document.createElement("details");
  details.id = "answerDetails";

  const summary = document.createElement("summary");
  summary.textContent = "Show Answer";
  details.appendChild(summary);

  const answerPara = document.createElement("p");
  answerPara.textContent = item.translation;
  details.appendChild(answerPara);

  const feedbackDiv = document.createElement("div");
  feedbackDiv.id = "feedbackButtons";
  feedbackDiv.style.cssText = "margin-top: 10px; display: none;";

  const knewBtn = document.createElement("button");
  knewBtn.id = "knewBtn";
  knewBtn.textContent = "✅ I knew it";
  feedbackDiv.appendChild(knewBtn);

  const didntBtn = document.createElement("button");
  didntBtn.id = "didntBtn";
  didntBtn.textContent = "❌ I didn't know it";
  feedbackDiv.appendChild(didntBtn);

  details.appendChild(feedbackDiv);
  box.appendChild(details);

  document
    .querySelector("#answerDetails")
    .addEventListener("toggle", function () {
      const btns = document.getElementById("feedbackButtons");
      if (this.open) btns.style.display = "block";
    });

  document.getElementById("prevWordBtn").onclick = () => {
    if (practiceInTransition) return;
    if (practiceIndex > 0) {
      practiceIndex--;
      localStorage.setItem("practiceIndex", practiceIndex);
      showCurrentPracticeWord();
    }
  };

  document.getElementById("nextWordBtn").onclick = () => {
    if (practiceInTransition) return;
    practiceIndex++;
    localStorage.setItem("practiceIndex", practiceIndex);
    showCurrentPracticeWord();
  };

  function handleFeedback(knewIt) {
    if (practiceInTransition) return;
    practiceInTransition = true;

    document.getElementById("knewBtn").disabled = true;
    document.getElementById("didntBtn").disabled = true;

    if (practiceAdvanceTimerId) {
      clearTimeout(practiceAdvanceTimerId);
      practiceAdvanceTimerId = null;
    }

    const isFirstTime = !getLastPracticeDate();
    const timerWasReset = localStorage.getItem("timerWasReset") === "true";
    const isDue =
      !item.nextReview || new Date(item.nextReview).getTime() <= Date.now();

    if (isFirstTime || timerWasReset || isDue) {
      scheduleReview(item, knewIt);
      updatePracticeButton();
    }

    if (knewIt) {
      const messages = [
        "🎉 Excellent! You're doing great!",
        "🌟 Fantastic! Keep up the good work!",
        "💪 Amazing! You're mastering this!",
        "🔥 Outstanding! You're on fire!",
        "⭐ Brilliant! You're getting stronger!",
      ];
      showFeedbackPopup(
        messages[Math.floor(Math.random() * messages.length)],
        "success"
      );
    } else {
      const messages = [
        "💪 Don't worry! Every expert was once a beginner. Keep practicing!",
        "🌟 That's okay! Mistakes are how we learn. You've got this!",
        "🚀 No problem! Each attempt makes you stronger. Keep going!",
        "⭐ Learning takes time! You're making progress with every try!",
        "🔥 Every challenge is an opportunity to grow. You're doing great!",
      ];
      showFeedbackPopup(
        messages[Math.floor(Math.random() * messages.length)],
        "warning"
      );
    }

    practiceAdvanceTimerId = setTimeout(() => {
      practiceIndex++;
      localStorage.setItem("practiceIndex", practiceIndex);
      practiceInTransition = false;
      practiceAdvanceTimerId = null;
      showCurrentPracticeWord();
    }, 2000);
  }

  document.getElementById("knewBtn").onclick = () => handleFeedback(true);
  document.getElementById("didntBtn").onclick = () => handleFeedback(false);
}

window.startPracticeAllWords = startPracticeAllWords;
window.startPracticeDueWords = startPracticeDueWords;
window.resetPractice = resetPractice;

let clearOutputsDebounceId;
let selectionDebounceId;
let lastSelectionText = "";

function clearOutputsNow() {
  const ids = ["output", "extraDetails", "idiomOutput", "highlightTranslation"];
  ids.forEach((id) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.textContent = "";
    el.classList.add("hidden");
  });
}

document.getElementById("inputText").addEventListener("input", () => {
  clearTimeout(clearOutputsDebounceId);
  clearOutputsDebounceId = setTimeout(clearOutputsNow, 250);
});

document.getElementById("targetLang").addEventListener("change", () => {
  lastSelectionText = "";
});

document.getElementById("translateBtn").addEventListener("click", async () => {
  const inputText = document.getElementById("inputText").value;
  const targetLangCode = document.getElementById("targetLang").value;
  const targetLang = getLangName(targetLangCode);

  const outputElement = document.getElementById("output");
  outputElement.textContent = "";
  outputElement.classList.add("hidden");

  document.getElementById("highlightTranslation").replaceChildren();
  document.getElementById("highlightTranslation").classList.add("hidden");

  document.getElementById("extraDetails").replaceChildren();
  document.getElementById("extraDetails").classList.add("hidden");

  document.getElementById("idiomOutput").replaceChildren();
  document.getElementById("idiomOutput").classList.add("hidden");

  if (!inputText.trim()) {
    outputElement.textContent = "Please enter text to translate.";
    outputElement.classList.remove("hidden");
    return;
  }

  const translateBtn = document.getElementById("translateBtn");
  const spinnerEl = ensureInlineSpinner(translateBtn, "translateSpinner");

  const data = await apiCall(
    "translate",
    { inputText, targetLang },
    { buttonEl: translateBtn, spinnerEl }
  );
  if (!data) return;

  outputElement.textContent = data.translation || "Translation failed";
  outputElement.classList.remove("hidden");
});

let availableVoices = [];

speechSynthesis.onvoiceschanged = () => {
  availableVoices = speechSynthesis.getVoices();
};

document.getElementById("speakBtn").addEventListener("click", () => {
  const text = document.getElementById("output").textContent;
  const invalid = ["", "Please enter text to translate.", "Translation failed"];

  if (invalid.includes(text)) {
    showFeedbackPopup("Nothing to speak. Translate something first.", "warning");
    return;
  }

  const langCode = document.getElementById("targetLang").value;
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = langCode;

  const langPrefix = langCode.split("-")[0];
  const voice =
    availableVoices.find((v) => v.lang === langCode) ||
    availableVoices.find((v) => v.lang.startsWith(langPrefix));
  if (voice) utterance.voice = voice;

  utterance.onerror = () => {
    showFeedbackPopup("Speech synthesis failed for this language.", "warning");
  };

  speechSynthesis.speak(utterance);
});

document.getElementById("detailsBtn").addEventListener("click", async () => {
  const inputText = document.getElementById("inputText").value;
  const targetLangCode = document.getElementById("targetLang").value;
  const targetLang = getLangName(targetLangCode);

  if (!inputText.trim()) {
    const el = document.getElementById("extraDetails");
    el.replaceChildren();
    const p = document.createElement("p");
    p.className = "validation-error";
    p.textContent = "Please enter a word or phrase first!";
    el.appendChild(p);
    el.classList.remove("hidden");
    return;
  }

  const detailsBtn = document.getElementById("detailsBtn");
  const spinnerEl = ensureInlineSpinner(detailsBtn, "detailsSpinner");

  const data = await apiCall(
    "details",
    { inputText, targetLang },
    { buttonEl: detailsBtn, spinnerEl }
  );
  if (!data) return;

  const extraDetailsElement = document.getElementById("extraDetails");
  extraDetailsElement.replaceChildren();

  const examplesHeading = document.createElement("h4");
  examplesHeading.textContent = "Examples:";
  extraDetailsElement.appendChild(examplesHeading);

  const examplesPara = document.createElement("p");
  if (Array.isArray(data.examples)) {
    const examplesList = document.createElement("div");
    data.examples.forEach((ex) => {
      const exampleDiv = document.createElement("div");
      exampleDiv.textContent = `${ex?.text || ""} → ${ex?.translation || ""}`;
      examplesList.appendChild(exampleDiv);
    });
    examplesPara.appendChild(examplesList);
  } else {
    examplesPara.textContent = "No examples available.";
  }
  extraDetailsElement.appendChild(examplesPara);

  const synonymsHeading = document.createElement("h4");
  synonymsHeading.textContent = "Synonyms:";
  extraDetailsElement.appendChild(synonymsHeading);

  const synonymsPara = document.createElement("p");
  if (Array.isArray(data.synonyms)) {
    const synonymsList = document.createElement("div");
    data.synonyms.forEach((s) => {
      const synonymDiv = document.createElement("div");
      synonymDiv.textContent = `${s?.word || ""} → ${s?.translation || ""}`;
      synonymsList.appendChild(synonymDiv);
    });
    synonymsPara.appendChild(synonymsList);
  } else {
    synonymsPara.textContent = "No synonyms available.";
  }
  extraDetailsElement.appendChild(synonymsPara);
  extraDetailsElement.classList.remove("hidden");
});

document.getElementById("idiomBtn").addEventListener("click", async () => {
  const inputText = document.getElementById("inputText").value;
  const targetLangCode = document.getElementById("targetLang").value;
  const targetLang = getLangName(targetLangCode);

  if (!inputText.trim()) {
    const el = document.getElementById("idiomOutput");
    el.replaceChildren();
    const p = document.createElement("p");
    p.className = "validation-error";
    p.textContent = "Please enter a word or phrase first.";
    el.appendChild(p);
    el.classList.remove("hidden");
    return;
  }

  const idiomBtn = document.getElementById("idiomBtn");
  const spinnerEl = ensureInlineSpinner(idiomBtn, "idiomSpinner");

  const data = await apiCall(
    "idiom",
    { inputText, targetLang, inputLang: "auto" },
    { buttonEl: idiomBtn, spinnerEl }
  );
  if (!data) return;

  const idiomOutputElement = document.getElementById("idiomOutput");
  idiomOutputElement.replaceChildren();

  const idiomHeading = document.createElement("h4");
  idiomHeading.textContent = "📌 Idiom:";
  idiomOutputElement.appendChild(idiomHeading);

  const idiomPara = document.createElement("p");
  idiomPara.textContent = data.idiom || "Not available";
  idiomOutputElement.appendChild(idiomPara);

  const meaningHeading = document.createElement("h4");
  meaningHeading.textContent = "💬 Meaning:";
  idiomOutputElement.appendChild(meaningHeading);

  const meaningPara = document.createElement("p");
  meaningPara.textContent = data.meaning || "Not available";
  idiomOutputElement.appendChild(meaningPara);

  const equivalentHeading = document.createElement("h4");
  equivalentHeading.textContent = `🌍 Equivalent in ${targetLang}:`;
  idiomOutputElement.appendChild(equivalentHeading);

  const equivalentPara = document.createElement("p");
  equivalentPara.textContent = data.equivalent || "Not available";
  idiomOutputElement.appendChild(equivalentPara);
  idiomOutputElement.classList.remove("hidden");
});

document.getElementById("favBtn").addEventListener("click", () => {
  const inputText = document.getElementById("inputText").value.trim();
  const translation = document.getElementById("output").textContent.trim();
  const invalidValues = [
    "",
    "Translation failed",
    "Please enter text to translate.",
  ];

  if (!inputText || invalidValues.includes(translation)) {
    showFeedbackPopup(
      "Translate something first before adding to favorites.",
      "warning"
    );
    return;
  }

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
    practiceQueue = JSON.parse(localStorage.getItem("practiceQueue")) || [];
    document.getElementById("nextPracticeBtn").style.display = "none";
    showCurrentPracticeWord();
  }
});

document.getElementById("dueWordsBtn").addEventListener("click", () => {
  if (!localStorage.getItem("practiceStarted")) {
    startPracticeDueWords();
  }
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
  document.getElementById("practiceArea").replaceChildren();
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

function handleSelectionTranslate() {
  const selected = window.getSelection().toString().trim();
  const targetLangCode = document.getElementById("targetLang").value;
  const targetLang = getLangName(targetLangCode);

  if (selected.length < 1) return;
  if (selected === lastSelectionText) return;
  lastSelectionText = selected;

  const box = document.getElementById("highlightTranslation");
  const spinnerEl = ensureInlineSpinner(box, "selectionSpinner");

  apiCall("translate", { inputText: selected, targetLang }, { spinnerEl }).then(
    (data) => {
      if (!data) return;

      box.replaceChildren();

      const para = document.createElement("p");
      const strong = document.createElement("strong");
      strong.textContent = selected;
      para.appendChild(strong);
      para.appendChild(
        document.createTextNode(
          ` → ${data.translation || "Translation failed"}`
        )
      );
      box.appendChild(para);
      box.classList.remove("hidden");
    }
  );
}

document.getElementById("inputText").addEventListener("mouseup", () => {
  clearTimeout(selectionDebounceId);
  selectionDebounceId = setTimeout(handleSelectionTranslate, 300);
});
