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
} from "./practice.js";

const API_BASE = "https://pooriya-pitranslate.hosting.codeyourfuture.io/api";

// Centralized API call helper with loading and error handling
async function apiCall(
  endpoint,
  payload,
  { buttonEl, spinnerEl, timeoutMs = 15000 } = {}
) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    // Show loading state
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
    // Restore UI state
    if (buttonEl) buttonEl.removeAttribute("disabled");
    if (spinnerEl) spinnerEl.classList.add("hidden");
  }
}

// Tiny spinner utility
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

// Wait for DOM to be ready before manipulating elements
document.addEventListener("DOMContentLoaded", () => {
  // Hide the detail sections initially, but keep the output visible
  const detailPart = document.getElementById("output").closest("div");

  // Hide all output sections initially
  const detailSections = [
    "output",
    "highlightTranslation",
    "extraDetails",
    "idiomOutput",
    "practiceArea",
  ];
  detailSections.forEach((id) => {
    const element = document.getElementById(id);
    if (element) {
      element.classList.add("hidden");
    }
  });

  // Initialize app
  const savedTheme = localStorage.getItem("theme") || "light";
  document.documentElement.setAttribute("data-theme", savedTheme);
  renderFavorites();

  // Check if user has already practiced and show completion page
  const lastPracticeDate = getLastPracticeDate();
  const practiceStarted = localStorage.getItem("practiceStarted");

  if (lastPracticeDate && !practiceStarted) {
    // User has practiced before, show completion page and hide the top button
    showPracticeCompletionOptions();
    document.getElementById("nextPracticeBtn").style.display = "none";
  } else {
    // First time or no previous practice, show start button
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

window.removeFavoriteAndRender = (id) => {
  removeFavorite(id);
  renderFavorites();
  buildPracticeQueue();
  updatePracticeButton();
};

function buildPracticeQueue() {
  const allFavorites = getAllFavorites();
  // Randomize the queue each time
  const shuffledFavorites = [...allFavorites].sort(() => Math.random() - 0.5);
  localStorage.setItem("practiceQueue", JSON.stringify(shuffledFavorites));
  updatePracticeButton();
  return shuffledFavorites;
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

function startPracticeAllWords() {
  const allFavorites = loadFavorites();
  // Randomize the queue each time
  const shuffledFavorites = [...allFavorites].sort(() => Math.random() - 0.5);
  localStorage.setItem("practiceQueue", JSON.stringify(shuffledFavorites));
  localStorage.setItem("practiceIndex", "0");
  localStorage.setItem("practiceStarted", "true");
  // Hide the practice area initially, it will be shown when practice starts
  document.getElementById("practiceArea").classList.add("hidden");
  updatePracticeButton();

  // Set up the practice variables and show the first word directly
  practiceQueue = shuffledFavorites;
  practiceIndex = 0;
  showCurrentPracticeWord();
}

function startPracticeDueWords() {
  const dueItems = getDueItems();

  if (dueItems.length === 0) {
    // No due words, show popup notification
    showFeedbackPopup(
      "No due words right now. You can still practice all words.",
      "warning"
    );
    return;
  }

  // Randomize the queue each time (same pattern as startPracticeAllWords)
  const shuffledDueItems = [...dueItems].sort(() => Math.random() - 0.5);
  localStorage.setItem("practiceQueue", JSON.stringify(shuffledDueItems));
  localStorage.setItem("practiceIndex", "0");
  localStorage.setItem("practiceStarted", "true");
  // Hide the practice area initially, it will be shown when practice starts
  document.getElementById("practiceArea").classList.add("hidden");
  updatePracticeButton();

  // Set up the practice variables and show the first word directly
  practiceQueue = shuffledDueItems;
  practiceIndex = 0;
  showCurrentPracticeWord();
}

// Function to show feedback popup
function showFeedbackPopup(message, type) {
  // Remove any existing popup
  const existingPopup = document.getElementById("feedbackPopup");
  if (existingPopup) {
    existingPopup.remove();
  }

  // Create popup
  const popup = document.createElement("div");
  popup.id = "feedbackPopup";
  popup.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: ${type === "success" ? "#d4edda" : "#fff3cd"};
    color: ${type === "success" ? "#155724" : "#856404"};
    border: 1px solid ${type === "success" ? "#c3e6cb" : "#ffeaa7"};
    border-radius: 8px;
    padding: 1.5rem 2rem;
    font-size: 1.1rem;
    font-weight: bold;
    text-align: center;
    z-index: 1000;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    max-width: 400px;
    word-wrap: break-word;
  `;
  popup.textContent = message;

  document.body.appendChild(popup);

  // Auto-remove after 2 seconds
  setTimeout(() => {
    if (popup.parentNode) {
      popup.remove();
    }
  }, 2000);
}

// Function to show current practice word without changing index
function showCurrentPracticeWord() {
  const box = document.getElementById("practiceArea");
  box.classList.remove("hidden");

  // Don't rebuild queue here - use the existing queue (could be all favorites or just due items)
  // practiceQueue = buildPracticeQueue(); // This was overriding the "all favorites" queue!

  if (practiceQueue.length === 0) {
    // Show completion options instead of just "no words" message
    showPracticeCompletionOptions();
    localStorage.removeItem("practiceStarted");
    localStorage.removeItem("practiceIndex");
    return;
  }

  // Check if we've completed all items in the queue
  if (practiceIndex >= practiceQueue.length) {
    // Small delay to ensure all scheduling operations are complete
    setTimeout(() => {
      showPracticeCompletionOptions();
      localStorage.removeItem("practiceStarted");
      localStorage.removeItem("practiceIndex");
    }, 100);
    return;
  }

  const item = practiceQueue[practiceIndex];

  box.innerHTML = ""; // Clear existing content

  // Create navigation container
  const navDiv = document.createElement("div");
  navDiv.style.cssText =
    "display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;";

  // Previous button
  const prevBtn = document.createElement("button");
  prevBtn.id = "prevWordBtn";
  prevBtn.textContent = "← Previous";
  prevBtn.style.cssText =
    "padding: 0.5rem 1rem; background: #6c757d; color: white; border: none; border-radius: 4px; cursor: pointer;";
  if (practiceIndex === 0) {
    prevBtn.disabled = true;
  }
  navDiv.appendChild(prevBtn);

  // Counter span
  const counterSpan = document.createElement("span");
  counterSpan.style.fontWeight = "bold";
  counterSpan.textContent = `${practiceIndex + 1} / ${practiceQueue.length}`;
  navDiv.appendChild(counterSpan);

  // Next button
  const nextBtn = document.createElement("button");
  nextBtn.id = "nextWordBtn";
  nextBtn.textContent = "Next →";
  nextBtn.style.cssText =
    "padding: 0.5rem 1rem; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer;";
  navDiv.appendChild(nextBtn);

  box.appendChild(navDiv);

  // Question paragraph
  const questionPara = document.createElement("p");
  const questionStrong = document.createElement("strong");
  questionStrong.textContent = "Translate this: ";
  questionPara.appendChild(questionStrong);
  questionPara.appendChild(document.createTextNode(item.text));
  box.appendChild(questionPara);

  // Details element
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

  // Previous Word button
  document.getElementById("prevWordBtn").onclick = () => {
    if (practiceIndex > 0) {
      practiceIndex--;
      localStorage.setItem("practiceIndex", practiceIndex);
      showCurrentPracticeWord();
    }
  };

  // Next Word button
  document.getElementById("nextWordBtn").onclick = () => {
    practiceIndex++;
    localStorage.setItem("practiceIndex", practiceIndex);
    showCurrentPracticeWord();
  };

  // Feedback buttons - show popup message and auto-advance
  document.getElementById("knewBtn").onclick = () => {
    // Disable both feedback buttons to prevent multiple clicks
    document.getElementById("knewBtn").disabled = true;
    document.getElementById("didntBtn").disabled = true;

    // Only schedule review if this is the first time practicing, timer was reset, or item is due
    const isFirstTime = !getLastPracticeDate();
    const timerWasReset = localStorage.getItem("timerWasReset") === "true";
    const isDue =
      !item.nextReview || new Date(item.nextReview).getTime() <= Date.now();

    if (isFirstTime || timerWasReset || isDue) {
      scheduleReview(item, true);
      // Immediately refresh due counter so user sees due → 0
      updatePracticeButton();
    }

    const messages = [
      "🎉 Excellent! You're doing great!",
      "🌟 Fantastic! Keep up the good work!",
      "💪 Amazing! You're mastering this!",
      "🔥 Outstanding! You're on fire!",
      "⭐ Brilliant! You're getting stronger!",
    ];
    const randomMessage = messages[Math.floor(Math.random() * messages.length)];

    // Show popup message
    showFeedbackPopup(randomMessage, "success");

    // Auto-advance after 2 seconds
    setTimeout(() => {
      practiceIndex++;
      localStorage.setItem("practiceIndex", practiceIndex);
      showCurrentPracticeWord();
    }, 2000);
  };

  document.getElementById("didntBtn").onclick = () => {
    // Disable both feedback buttons to prevent multiple clicks
    document.getElementById("knewBtn").disabled = true;
    document.getElementById("didntBtn").disabled = true;

    // Only schedule review if this is the first time practicing, timer was reset, or item is due
    const isFirstTime = !getLastPracticeDate();
    const timerWasReset = localStorage.getItem("timerWasReset") === "true";
    const isDue =
      !item.nextReview || new Date(item.nextReview).getTime() <= Date.now();

    if (isFirstTime || timerWasReset || isDue) {
      scheduleReview(item, false);
      // Immediately refresh due counter so user sees due → 0
      updatePracticeButton();
    }

    const messages = [
      "💪 Don't worry! Every expert was once a beginner. Keep practicing!",
      "🌟 That's okay! Mistakes are how we learn. You've got this!",
      "🚀 No problem! Each attempt makes you stronger. Keep going!",
      "⭐ Learning takes time! You're making progress with every try!",
      "🔥 Every challenge is an opportunity to grow. You're doing great!",
    ];
    const randomMessage = messages[Math.floor(Math.random() * messages.length)];

    // Show popup message
    showFeedbackPopup(randomMessage, "warning");

    // Auto-advance after 2 seconds
    setTimeout(() => {
      practiceIndex++;
      localStorage.setItem("practiceIndex", practiceIndex);
      showCurrentPracticeWord();
    }, 2000);
  };
}

// Make functions available globally for practice.js
window.startPracticeAllWords = startPracticeAllWords;
window.startPracticeDueWords = startPracticeDueWords;
window.resetPractice = resetPractice;

// Debounced input clearing functionality
let clearOutputsDebounceId;

// Debounced selection translation functionality
let selectionDebounceId;
let lastSelectionText = "";

function clearOutputsNow() {
  const ids = ["output", "extraDetails", "idiomOutput", "highlightTranslation"];
  ids.forEach((id) => {
    const el = document.getElementById(id);
    if (!el) return;
    // Clear content safely
    el.textContent = "";
    // Hide the container
    el.classList.add("hidden");
  });

  // Hide pronunciation check when outputs are cleared
  const pronunciationCheck = document.getElementById("pronunciationCheck");
  pronunciationCheck.style.display = "none";
}

// Add input listener to clear outputs when user types
document.getElementById("inputText").addEventListener("input", () => {
  clearTimeout(clearOutputsDebounceId);
  clearOutputsDebounceId = setTimeout(clearOutputsNow, 250);
});

document.getElementById("translateBtn").addEventListener("click", async () => {
  const inputText = document.getElementById("inputText").value;
  const targetLang = document.getElementById("targetLang").value;
  document.getElementById("output").textContent = "";
  document.getElementById("output").classList.add("hidden");

  document.getElementById("highlightTranslation").innerHTML = "";
  document.getElementById("highlightTranslation").classList.add("hidden");

  document.getElementById("extraDetails").innerHTML = "";
  document.getElementById("extraDetails").classList.add("hidden");

  document.getElementById("idiomOutput").innerHTML = "";
  document.getElementById("idiomOutput").classList.add("hidden");

  if (!inputText.trim()) {
    const outputElement = document.getElementById("output");
    outputElement.innerText = "Please enter text to translate.";
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
  if (!data) return; // toast already shown

  const outputElement = document.getElementById("output");
  outputElement.textContent = data.translation || "Translation failed";
  outputElement.classList.remove("hidden");

  // Show pronunciation check button after translation
  const pronunciationCheck = document.getElementById("pronunciationCheck");
  pronunciationCheck.style.display = "block";
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

// Voice Input functionality
let recognition = null;
let isListening = false;

// Check for Web Speech API support
if ("webkitSpeechRecognition" in window || "SpeechRecognition" in window) {
  const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;
  recognition = new SpeechRecognition();

  recognition.continuous = false;
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;

  recognition.onstart = () => {
    isListening = true;
    const btn = document.getElementById("voiceInputBtn");
    btn.textContent = "🎙 Listening...";
    btn.classList.add("listening");
    btn.disabled = true;
  };

  recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript;
    const inputTextElement = document.getElementById("inputText");

    // Clear previous outputs (reuse existing logic)
    document.getElementById("output").textContent = "";
    document.getElementById("output").classList.add("hidden");
    document.getElementById("highlightTranslation").innerHTML = "";
    document.getElementById("highlightTranslation").classList.add("hidden");
    document.getElementById("extraDetails").innerHTML = "";
    document.getElementById("extraDetails").classList.add("hidden");
    document.getElementById("idiomOutput").innerHTML = "";
    document.getElementById("idiomOutput").classList.add("hidden");

    // Place transcript into input text
    inputTextElement.value = transcript;

    // Trigger input event to clear outputs (reuse existing debounced logic)
    inputTextElement.dispatchEvent(new Event("input"));
  };

  recognition.onerror = (event) => {
    console.error("Speech recognition error:", event.error);
    showFeedbackPopup(`Voice input error: ${event.error}`, "warning");
    resetVoiceButton();
  };

  recognition.onend = () => {
    isListening = false;
    resetVoiceButton();
  };

  function resetVoiceButton() {
    const btn = document.getElementById("voiceInputBtn");
    btn.textContent = "🎙 Voice Input";
    btn.classList.remove("listening", "processing");
    btn.disabled = false;
  }

  document.getElementById("voiceInputBtn").addEventListener("click", () => {
    if (!isListening) {
      // Set recognition language from target language
      const targetLang = document.getElementById("targetLang").value;
      recognition.lang = targetLang;

      try {
        recognition.start();
      } catch (error) {
        console.error("Failed to start recognition:", error);
        showFeedbackPopup(
          "Failed to start voice input. Please try again.",
          "warning"
        );
        resetVoiceButton();
      }
    }
  });
} else {
  // Hide voice input button if not supported
  document.getElementById("voiceInputBtn").style.display = "none";
}

// Pronunciation check functionality
function calculateSimilarity(str1, str2) {
  // Normalize strings: lowercase, remove punctuation, trim whitespace
  const normalize = (str) =>
    str
      .toLowerCase()
      .replace(/[^\w\s]/g, "")
      .trim();
  const s1 = normalize(str1);
  const s2 = normalize(str2);

  if (s1 === s2) return 1.0;
  if (s1.length === 0 || s2.length === 0) return 0.0;

  // Calculate Levenshtein distance
  const matrix = [];
  for (let i = 0; i <= s2.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= s1.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= s2.length; i++) {
    for (let j = 1; j <= s1.length; j++) {
      if (s2.charAt(i - 1) === s1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1, // insertion
          matrix[i - 1][j] + 1 // deletion
        );
      }
    }
  }

  const distance = matrix[s2.length][s1.length];
  const maxLength = Math.max(s1.length, s2.length);
  return 1 - distance / maxLength;
}

function getSimilarityScore(similarity) {
  if (similarity >= 0.85) {
    return {
      level: "excellent",
      text: `Excellent! (${Math.round(similarity * 100)}%)`,
    };
  } else if (similarity >= 0.7) {
    return { level: "good", text: `Good! (${Math.round(similarity * 100)}%)` };
  } else {
    return {
      level: "needs-practice",
      text: `Needs practice (${Math.round(similarity * 100)}%)`,
    };
  }
}

// Pronunciation check button functionality
let pronunciationRecognition = null;
let isCheckingPronunciation = false;

// Initialize pronunciation recognition if supported
if ("webkitSpeechRecognition" in window || "SpeechRecognition" in window) {
  const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;
  pronunciationRecognition = new SpeechRecognition();

  pronunciationRecognition.continuous = false;
  pronunciationRecognition.interimResults = false;
  pronunciationRecognition.maxAlternatives = 1;

  pronunciationRecognition.onstart = () => {
    isCheckingPronunciation = true;
    const btn = document.getElementById("pronunciationBtn");
    btn.textContent = "🎤 Listening...";
    btn.classList.add("listening");
    btn.disabled = true;
  };

  pronunciationRecognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript;
    const targetText = document.getElementById("output").textContent;

    // Calculate similarity
    const similarity = calculateSimilarity(transcript, targetText);
    const score = getSimilarityScore(similarity);

    // Display result
    const resultElement = document.getElementById("pronunciationResult");
    resultElement.textContent = `You said: "${transcript}" | ${score.text}`;
    resultElement.className = `pronunciation-result ${score.level}`;
  };

  pronunciationRecognition.onerror = (event) => {
    console.error("Pronunciation check error:", event.error);
    showFeedbackPopup(`Pronunciation check error: ${event.error}`, "warning");
    resetPronunciationButton();
  };

  pronunciationRecognition.onend = () => {
    isCheckingPronunciation = false;
    resetPronunciationButton();
  };

  function resetPronunciationButton() {
    const btn = document.getElementById("pronunciationBtn");
    btn.textContent = "🎤 Check Pronunciation";
    btn.classList.remove("listening");
    btn.disabled = false;
  }

  document.getElementById("pronunciationBtn").addEventListener("click", () => {
    if (!isCheckingPronunciation) {
      const targetText = document.getElementById("output").textContent;
      if (!targetText || targetText === "Translation failed") {
        showFeedbackPopup("Please translate some text first!", "warning");
        return;
      }

      // Set recognition language from target language
      const targetLang = document.getElementById("targetLang").value;
      pronunciationRecognition.lang = targetLang;

      // Clear previous result
      const resultElement = document.getElementById("pronunciationResult");
      resultElement.textContent = "";
      resultElement.className = "";

      try {
        pronunciationRecognition.start();
      } catch (error) {
        console.error("Failed to start pronunciation check:", error);
        showFeedbackPopup(
          "Failed to start pronunciation check. Please try again.",
          "warning"
        );
        resetPronunciationButton();
      }
    }
  });
} else {
  // Hide pronunciation check if not supported
  document.getElementById("pronunciationCheck").style.display = "none";
}

document.getElementById("detailsBtn").addEventListener("click", async () => {
  const inputText = document.getElementById("inputText").value;
  const targetLang = document.getElementById("targetLang").value;

  if (!inputText.trim()) {
    const extraDetailsElement = document.getElementById("extraDetails");
    extraDetailsElement.innerHTML =
      "<p style='color: red;'>Please enter a word or phrase first!</p>";
    extraDetailsElement.classList.remove("hidden");
    return;
  }

  const detailsBtn = document.getElementById("detailsBtn");
  const spinnerEl = ensureInlineSpinner(detailsBtn, "detailsSpinner");

  const data = await apiCall(
    "details",
    { inputText, targetLang },
    { buttonEl: detailsBtn, spinnerEl }
  );
  if (!data) return; // toast already shown

  const extraDetailsElement = document.getElementById("extraDetails");
  extraDetailsElement.innerHTML = ""; // Clear existing content

  // Create Examples section
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

  // Create Synonyms section
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
  const targetLang = document.getElementById("targetLang").value;

  if (!inputText.trim()) {
    const idiomOutputElement = document.getElementById("idiomOutput");
    idiomOutputElement.innerHTML =
      "<p style='color: red;'>Please enter a word or phrase first.</p>";
    idiomOutputElement.classList.remove("hidden");
    return;
  }

  const idiomBtn = document.getElementById("idiomBtn");
  const spinnerEl = ensureInlineSpinner(idiomBtn, "idiomSpinner");

  const data = await apiCall(
    "idiom",
    { inputText, targetLang, inputLang: "auto" },
    { buttonEl: idiomBtn, spinnerEl }
  );
  if (!data) return; // toast already shown

  const idiomOutputElement = document.getElementById("idiomOutput");
  idiomOutputElement.innerHTML = ""; // Clear existing content

  // Create Idiom section
  const idiomHeading = document.createElement("h4");
  idiomHeading.textContent = "📌 Idiom:";
  idiomOutputElement.appendChild(idiomHeading);

  const idiomPara = document.createElement("p");
  idiomPara.textContent = data.idiom || "Not available";
  idiomOutputElement.appendChild(idiomPara);

  // Create Meaning section
  const meaningHeading = document.createElement("h4");
  meaningHeading.textContent = "💬 Meaning:";
  idiomOutputElement.appendChild(meaningHeading);

  const meaningPara = document.createElement("p");
  meaningPara.textContent = data.meaning || "Not available";
  idiomOutputElement.appendChild(meaningPara);

  // Create Equivalent section
  const equivalentHeading = document.createElement("h4");
  equivalentHeading.textContent = `🌍 Equivalent in ${targetLang}:`;
  idiomOutputElement.appendChild(equivalentHeading);

  const equivalentPara = document.createElement("p");
  equivalentPara.textContent = data.equivalent || "Not available";
  idiomOutputElement.appendChild(equivalentPara);
  idiomOutputElement.classList.remove("hidden");
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
    // First time starting practice
    localStorage.setItem("practiceStarted", "true");
    practiceIndex = 0;
    localStorage.setItem("practiceIndex", "0");
    // Use the queue that's already in localStorage (could be all favorites or just due items)
    practiceQueue = JSON.parse(localStorage.getItem("practiceQueue")) || [];
    // Hide the "Start Practice" button after first click
    document.getElementById("nextPracticeBtn").style.display = "none";

    // Show the first word (index 0)
    showCurrentPracticeWord();
  } else {
    // This should not happen since the button is hidden during practice
    // The "Next Word" functionality is handled by the button inside showCurrentPracticeWord()
    console.warn(
      "Start Practice button clicked during active practice session"
    );
  }
});

document.getElementById("dueWordsBtn").addEventListener("click", () => {
  if (!localStorage.getItem("practiceStarted")) {
    // Start practice with due words only
    startPracticeDueWords();
  } else {
    // This should not happen since the button is hidden during practice
    console.warn("Due Words button clicked during active practice session");
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

function handleSelectionTranslate() {
  const selected = window.getSelection().toString().trim();
  const targetLang = document.getElementById("targetLang").value;

  if (selected.length < 1) return;

  // Optional small optimization: skip if same as last time
  if (selected === lastSelectionText) return;
  lastSelectionText = selected;

  const box = document.getElementById("highlightTranslation");
  const spinnerEl = ensureInlineSpinner(box, "selectionSpinner");

  apiCall("translate", { inputText: selected, targetLang }, { spinnerEl }).then(
    (data) => {
      if (!data) return; // toast already shown

      box.innerHTML = ""; // Clear existing content

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

document.addEventListener("mouseup", () => {
  clearTimeout(selectionDebounceId);
  selectionDebounceId = setTimeout(handleSelectionTranslate, 300);
});
