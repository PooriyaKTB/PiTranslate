import {
  addFavorite,
  renderFavorites,
  removeFavorite,
  clearFavorites,
  loadFavorites,
} from "./favorites.js";
import {
  getDueItems,
  startPractice,
  stopPractice,
  renderPractice,
} from "./practice.js";
import { showToast } from "./toast.js";
import { fillLanguageSelect, getLangName, saveLang } from "./languages.js";

const IS_LOCAL = ["localhost", "127.0.0.1"].includes(location.hostname);
const API_BASE = IS_LOCAL
  ? "http://localhost:5050/api"
  : "https://pooriya-pitranslate.grads.hosting.cyf.academy/api";

// Returns the chosen target language name, or null (with a hint unless quiet).
function getTargetLang({ quiet = false } = {}) {
  const select = document.getElementById("targetLang");
  const name = getLangName(select.value);
  if (!name && !quiet) {
    showToast("Choose a target language first.", "warning");
    select.focus();
  }
  return name || null;
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
      const body = await res.json().catch(() => null);
      const apiError = new Error(
        body?.error || `HTTP ${res.status}: ${res.statusText}`
      );
      apiError.isApiError = true;
      throw apiError;
    }

    return await res.json();
  } catch (error) {
    clearTimeout(timeoutId);
    const message = error.isApiError
      ? error.message
      : "Request failed. Please try again.";
    showToast(message, "warning");
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

  // Practice state from before practiceSession existed
  ["practiceQueue", "practiceIndex", "practiceStarted", "timerWasReset"].forEach(
    (key) => localStorage.removeItem(key)
  );
  refreshLists();
});

function refreshLists() {
  renderFavorites((id) => {
    removeFavorite(id);
    refreshLists();
  });
  renderPractice();
}

function showUser(user) {
  const welcomeText = document.getElementById("userWelcome");
  const logoutBtn = document.getElementById("logoutBtn");
  const authLinks = document.getElementById("authLinks");

  welcomeText.textContent = user
    ? `👋 Welcome, ${user.displayName || user.email}`
    : "👋 Welcome, you are in as a guest";
  logoutBtn.style.display = user ? "inline-block" : "none";
  authLinks.style.display = user ? "none" : "block";
}

// Loaded dynamically so the translator keeps working if the Firebase CDN is unreachable.
import("./firebase.js")
  .then(({ auth, onAuthStateChanged, signOut }) => {
    document.getElementById("logoutBtn").onclick = () =>
      signOut(auth).then(() => (window.location.href = "index.html"));
    onAuthStateChanged(auth, showUser);
  })
  .catch(() => showUser(null));

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

const targetLangSelect = document.getElementById("targetLang");
fillLanguageSelect(targetLangSelect, "Choose target language");
targetLangSelect.addEventListener("change", () => {
  saveLang(targetLangSelect.value);
  lastSelectionText = "";
});

document.getElementById("translateBtn").addEventListener("click", async () => {
  const inputText = document.getElementById("inputText").value;

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

  const targetLang = getTargetLang();
  if (!targetLang) return;

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
    showToast("Nothing to speak. Translate something first.", "warning");
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
    showToast("Speech synthesis failed for this language.", "warning");
  };

  speechSynthesis.speak(utterance);
});

document.getElementById("detailsBtn").addEventListener("click", async () => {
  const inputText = document.getElementById("inputText").value;

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

  const targetLang = getTargetLang();
  if (!targetLang) return;

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
  if (data.examples?.length) {
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
  if (data.synonyms?.length) {
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

  const targetLang = getTargetLang();
  if (!targetLang) return;

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
    showToast(
      "Translate something first before adding to favorites.",
      "warning"
    );
    return;
  }

  addFavorite({ text: inputText, translation });
  refreshLists();
});

document
  .getElementById("nextPracticeBtn")
  .addEventListener("click", () => startPractice(loadFavorites()));

document
  .getElementById("dueWordsBtn")
  .addEventListener("click", () => startPractice(getDueItems()));

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
  clearFavorites();
  stopPractice();
  refreshLists();
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

  if (selected.length < 1) return;
  if (selected === lastSelectionText) return;
  const targetLang = getTargetLang({ quiet: true });
  if (!targetLang) return;
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
