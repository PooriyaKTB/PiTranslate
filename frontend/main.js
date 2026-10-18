import {
  addFavorite,
  renderFavorites,
  removeFavorite,
  clearFavorites,
  loadFavorites,
} from "./favorites.js";
import { getDueItems, startPractice, stopPractice, renderPractice } from "./practice.js";
import { apiCall } from "./api.js";
import { showToast } from "./toast.js";
import { el } from "./dom.js";
import { fillLanguageSelect, getLangName, saveLang } from "./languages.js";

const MAX_CHARS = 5000;
const $ = (id) => document.getElementById(id);

const input = $("inputText");
const output = $("output");
const sourceSelect = $("sourceLang");
const targetSelect = $("targetLang");
const resultBoxes = ["selectionResult", "extraDetails", "idiomOutput"].map($);
const DETECT_LABEL = "Detect language";
const outputButtons = ["speakBtn", "copyBtn", "favBtn"].map($);

// Last successful translation ({ text, translation, pronunciation, langCode }); null once the input changes.
let lastTranslation = null;

// ===== Setup =====
fillLanguageSelect(sourceSelect, { label: DETECT_LABEL, value: "auto", selected: "auto" });
fillLanguageSelect(targetSelect, { label: "Choose target language" });

// Keys from older versions (pre-practiceSession practice state, old clear-favorites checkbox)
["practiceQueue", "practiceIndex", "practiceStarted", "timerWasReset", "skipDeleteConfirm"].forEach(
  (key) => localStorage.removeItem(key)
);

if (/Mac|iPhone|iPad/.test(navigator.userAgent)) {
  $("shortcutHint").textContent = "⌘ + Enter to translate";
}

refreshLists();

function refreshLists() {
  renderFavorites((id) => {
    removeFavorite(id);
    refreshLists();
  });
  renderPractice();
}

// ===== Auth (optional; loaded dynamically so the app works without the Firebase CDN) =====
function showUser(user) {
  $("userWelcome").textContent = user ? `👋 ${user.displayName || user.email}` : "";
  $("loginLink").classList.toggle("hidden", Boolean(user));
  $("logoutBtn").classList.toggle("hidden", !user);
}

import("./firebase.js")
  .then(({ auth, onAuthStateChanged, signOut }) => {
    $("logoutBtn").onclick = () =>
      signOut(auth).then(() => (window.location.href = "index.html"));
    onAuthStateChanged(auth, showUser);
  })
  .catch(() => showUser(null));

// ===== Input helpers =====
function requireText() {
  const text = input.value.trim();
  if (!text) {
    showToast("Type some text first.", "warning");
    input.focus();
  }
  return text || null;
}

function requireTargetLang() {
  const name = getLangName(targetSelect.value);
  if (!name) {
    showToast("Choose a target language first.", "warning");
    targetSelect.focus();
  }
  return name || null;
}

function sourceLangName() {
  return getLangName(sourceSelect.value) || "auto";
}

function selectedText() {
  return input.value.slice(input.selectionStart, input.selectionEnd).trim();
}

// ===== Output =====
function setTranslation(value) {
  lastTranslation = value;
  output.textContent = value?.translation ?? "";
  $("pronunciation").textContent = value?.pronunciation ?? "";
  $("pronunciation").classList.toggle("hidden", !value?.pronunciation);
  outputButtons.forEach((btn) => (btn.disabled = !value));
  updateSpeakButton();
}

function clearResults() {
  setTranslation(null);
  sourceSelect.options[0].textContent = DETECT_LABEL;
  $("didYouMean").classList.add("hidden");
  resultBoxes.forEach((box) => {
    box.replaceChildren();
    box.classList.add("hidden");
  });
}

function showResult(box, children) {
  box.replaceChildren(...children);
  box.classList.remove("hidden");
}

function updateCharCount() {
  const count = input.value.length;
  $("charCount").textContent = `${count} / ${MAX_CHARS}`;
  $("charCount").classList.toggle("near-limit", count > MAX_CHARS * 0.9);
}

// Offers "Translate “…”" when part of the input is selected.
function updateSelectionChip() {
  const selected = selectedText();
  const show = Boolean(selected) && selected !== input.value.trim();
  $("selectionBtn").classList.toggle("hidden", !show);
  $("shortcutHint").classList.toggle("hidden", show);
  if (show) $("selectionBtn").textContent = `Translate “${selected}”`;
}

// ===== Actions =====
async function translate() {
  const button = $("translateBtn");
  if (button.disabled) return;
  const text = requireText();
  if (!text) return;
  const targetLang = requireTargetLang();
  if (!targetLang) return;

  clearResults();
  const langCode = targetSelect.value;
  const data = await apiCall(
    "translate",
    { inputText: text, targetLang, inputLang: sourceLangName() },
    button
  );
  // Ignore the reply if the text changed while it was in flight
  if (!data?.translation || input.value.trim() !== text) return;

  // Favorites keep the corrected spelling when there was one
  setTranslation({
    text: data.correction || text,
    translation: data.translation,
    pronunciation: data.pronunciation,
    langCode,
  });
  if (data.detectedLanguage) {
    sourceSelect.options[0].textContent = `${data.detectedLanguage} — detected`;
  }
  if (data.correction) {
    $("correctionBtn").textContent = data.correction;
    $("didYouMean").classList.remove("hidden");
  }
}

let clearTimer;
input.addEventListener("input", () => {
  updateCharCount();
  updateSelectionChip();
  clearTimeout(clearTimer);
  clearTimer = setTimeout(clearResults, 250);
});

input.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
    e.preventDefault();
    translate();
  }
});

["select", "mouseup", "keyup"].forEach((type) =>
  input.addEventListener(type, updateSelectionChip)
);

targetSelect.addEventListener("change", () => saveLang(targetSelect.value));

$("translateBtn").addEventListener("click", translate);

$("correctionBtn").addEventListener("click", () => {
  input.value = $("correctionBtn").textContent;
  updateCharCount();
  translate();
});

$("swapBtn").addEventListener("click", () => {
  if (sourceSelect.value === "auto") {
    showToast("Pick a source language to swap.", "warning");
    sourceSelect.focus();
    return;
  }
  if (!requireTargetLang()) return;

  [sourceSelect.value, targetSelect.value] = [targetSelect.value, sourceSelect.value];
  saveLang(targetSelect.value);
  if (lastTranslation) {
    input.value = lastTranslation.translation;
    updateCharCount();
  }
  clearResults();
});

$("selectionBtn").addEventListener("click", async (e) => {
  const text = selectedText();
  if (!text) return;
  const targetLang = requireTargetLang();
  if (!targetLang) return;

  const data = await apiCall(
    "translate",
    { inputText: text, targetLang, inputLang: sourceLangName() },
    e.currentTarget
  );
  if (!data?.translation) return;
  showResult($("selectionResult"), [
    el("h3", { text: "Selection" }),
    el("p", {}, [el("strong", { text }), ` → ${data.translation}`]),
    ...(data.pronunciation ? [el("p", { className: "pronunciation", text: data.pronunciation })] : []),
  ]);
});

$("detailsBtn").addEventListener("click", async (e) => {
  const text = requireText();
  if (!text) return;
  const targetLang = requireTargetLang();
  if (!targetLang) return;

  const data = await apiCall("details", { inputText: text, targetLang }, e.currentTarget);
  if (!data) return;

  const pairs = (items, key) =>
    items.length
      ? el(
          "ul",
          {},
          items.map((item) =>
            el("li", {}, [
              item[key] ?? "",
              el("span", { className: "muted", text: ` → ${item.translation ?? ""}` }),
            ])
          )
        )
      : el("p", { className: "muted", text: "None found." });

  showResult($("extraDetails"), [
    el("h3", { text: "Examples" }),
    pairs(data.examples ?? [], "text"),
    el("h3", { text: "Synonyms" }),
    pairs(data.synonyms ?? [], "word"),
  ]);
});

$("idiomBtn").addEventListener("click", async (e) => {
  const text = requireText();
  if (!text) return;
  const targetLang = requireTargetLang();
  if (!targetLang) return;

  const data = await apiCall(
    "idiom",
    { inputText: text, targetLang, inputLang: sourceLangName() },
    e.currentTarget
  );
  if (!data) return;

  showResult($("idiomOutput"), [
    el("h3", { text: "Idiom" }),
    el("p", { text: data.idiom }),
    el("h3", { text: "Meaning" }),
    el("p", { text: data.meaning }),
    el("h3", { text: `Equivalent in ${targetLang}` }),
    el("p", { text: data.equivalent }),
  ]);
});

// ===== Output buttons (enabled only while lastTranslation is set) =====
// Listen uses the device's own voices, which vary by OS/browser (macOS has no Persian
// voice, for example), so the button is hidden when the translation's language has none.
const canSpeak = "speechSynthesis" in window;
let voices = [];

function findVoice(langCode) {
  const base = langCode.split("-")[0];
  return (
    voices.find((v) => v.lang === langCode) ||
    voices.find((v) => v.lang.split(/[-_]/)[0] === base)
  );
}

function updateSpeakButton() {
  const unavailable = !canSpeak || (lastTranslation && !findVoice(lastTranslation.langCode));
  $("speakBtn").classList.toggle("hidden", Boolean(unavailable));
}

if (canSpeak) {
  // Voices load asynchronously in most browsers
  const loadVoices = () => {
    voices = speechSynthesis.getVoices();
    updateSpeakButton();
  };
  loadVoices();
  speechSynthesis.addEventListener("voiceschanged", loadVoices);
}

$("speakBtn").addEventListener("click", () => {
  const { translation, langCode } = lastTranslation;
  const utterance = new SpeechSynthesisUtterance(translation);
  utterance.lang = langCode;
  utterance.voice = findVoice(langCode);
  utterance.onerror = () => showToast("Couldn't play the audio.", "warning");

  if (speechSynthesis.speaking) speechSynthesis.cancel();
  speechSynthesis.speak(utterance);
});

$("copyBtn").addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(lastTranslation.translation);
    showToast("Copied to clipboard.", "success");
  } catch {
    showToast("Couldn't copy. Select the text and copy it manually.", "warning");
  }
});

$("favBtn").addEventListener("click", () => {
  const added = addFavorite(lastTranslation);
  showToast(added ? "Saved to favorites." : "Already in your favorites.", added ? "success" : "warning");
  refreshLists();
});

// ===== Practice & favorites =====
$("nextPracticeBtn").addEventListener("click", () => startPractice(loadFavorites()));
$("dueWordsBtn").addEventListener("click", () => startPractice(getDueItems()));

const clearDialog = $("clearDialog");
$("clearFavoritesBtn").addEventListener("click", () => clearDialog.showModal());
$("cancelClearBtn").addEventListener("click", () => clearDialog.close());
// A click on the dialog element itself (not its content) is a click on the backdrop
clearDialog.addEventListener("click", (e) => {
  if (e.target === clearDialog) clearDialog.close();
});
$("confirmClearBtn").addEventListener("click", () => {
  clearFavorites();
  stopPractice();
  refreshLists();
  clearDialog.close();
});
