import { loadFavorites, saveFavorites } from "./favorites.js";
import { getJSON } from "./storage.js";
import { showToast } from "./toast.js";
import { el } from "./dom.js";

const DAY_MS = 24 * 60 * 60 * 1000;
const ADVANCE_DELAY_MS = 2000;

const KNEW_MESSAGES = [
  "🎉 Excellent! You're doing great!",
  "🌟 Fantastic! Keep up the good work!",
  "💪 Amazing! You're mastering this!",
  "🔥 Outstanding! You're on fire!",
  "⭐ Brilliant! You're getting stronger!",
];
const DIDNT_KNOW_MESSAGES = [
  "💪 Don't worry! Every expert was once a beginner. Keep practicing!",
  "🌟 That's okay! Mistakes are how we learn. You've got this!",
  "🚀 No problem! Each attempt makes you stronger. Keep going!",
  "⭐ Learning takes time! You're making progress with every try!",
  "🔥 Every challenge is an opportunity to grow. You're doing great!",
];

let advanceTimerId = null;

// Fisher-Yates shuffle for unbiased randomization
function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function randomItem(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function isDue(item, now = Date.now()) {
  return !item.nextReview || new Date(item.nextReview).getTime() <= now;
}

export function getDueItems() {
  return loadFavorites().filter((item) => isDue(item));
}

// A correct answer doubles the interval (2, 4, 8… days); a miss resets it to 1 day.
function scheduleReview(id, knewIt) {
  const favorites = loadFavorites();
  const item = favorites.find((f) => f.id === id);
  if (!item) return;

  item.reviewed = knewIt ? item.reviewed + 1 : 0;
  const days = knewIt ? 2 ** item.reviewed : 1;
  item.nextReview = new Date(Date.now() + days * DAY_MS).toISOString();
  saveFavorites(favorites);
}

// Session = { ids: [favorite ids in practice order], index }; absent when idle.
function loadSession() {
  return getJSON("practiceSession", null);
}

function saveSession(session) {
  localStorage.setItem("practiceSession", JSON.stringify(session));
}

export function stopPractice() {
  clearTimeout(advanceTimerId);
  localStorage.removeItem("practiceSession");
}

export function startPractice(items) {
  if (items.length === 0) {
    showToast("No due words right now. You can still practice all words.", "warning");
    return;
  }
  saveSession({ ids: shuffle(items.map((item) => item.id)), index: 0 });
  renderPractice();
}

function goTo(session, index) {
  saveSession({ ...session, index });
  renderPractice();
}

// Drops words deleted mid-session, keeping the position on the current word.
function pruneSession(session, favoritesById) {
  const exists = (id) => favoritesById.has(id);
  const removedBefore = session.ids
    .slice(0, session.index)
    .filter((id) => !exists(id)).length;
  return {
    ids: session.ids.filter(exists),
    index: session.index - removedBefore,
  };
}

export function renderPractice() {
  clearTimeout(advanceTimerId);

  const favorites = loadFavorites();
  const favoritesById = new Map(favorites.map((f) => [f.id, f]));
  const stored = loadSession();

  if (!stored) {
    renderIdle(favorites);
    return;
  }

  const session = pruneSession(stored, favoritesById);
  if (session.index >= session.ids.length) {
    stopPractice();
    localStorage.setItem("lastPracticeDate", new Date().toISOString());
    renderIdle(favorites, session.ids.length);
    return;
  }

  saveSession(session);
  renderWord(session, favoritesById.get(session.ids[session.index]));
}

function renderIdle(favorites, finishedCount = 0) {
  const hasFavorites = favorites.length > 0;
  const dueCount = favorites.filter((item) => isDue(item)).length;

  document.getElementById("practiceEmpty").classList.toggle("hidden", hasFavorites);
  document.querySelector(".practice-buttons").classList.toggle("hidden", !hasFavorites);
  const dueEl = document.getElementById("dueCount");
  dueEl.classList.toggle("hidden", !hasFavorites);
  dueEl.classList.toggle("has-due", dueCount > 0);
  dueEl.textContent = `✅ ${dueCount} ${dueCount === 1 ? "word is" : "words are"} due today`;

  const box = document.getElementById("practiceArea");
  const lastPractice = localStorage.getItem("lastPracticeDate");
  if (!hasFavorites || !lastPractice) {
    box.replaceChildren();
    box.classList.add("hidden");
    return;
  }

  const last = new Date(lastPractice);
  const nextReview = favorites
    .filter((item) => !isDue(item))
    .map((item) => new Date(item.nextReview))
    .sort((a, b) => a - b)[0];

  const summary = el("div", { className: "practice-completion" });
  if (finishedCount) {
    summary.append(
      el("h3", { text: "🎉 Practice Complete!" }),
      el("p", { text: `You reviewed ${finishedCount} ${finishedCount === 1 ? "word" : "words"}.` })
    );
  }
  summary.append(
    el("p", {
      className: "last-practice",
      text: `Last practice: ${last.toLocaleDateString()} at ${last.toLocaleTimeString()}`,
    }),
    el("p", {
      className: "next-review",
      text: nextReview
        ? `Next scheduled practice: ${nextReview.toLocaleDateString()}`
        : "No scheduled practice sessions",
    })
  );

  box.replaceChildren(summary);
  box.classList.remove("hidden");
}

function renderWord(session, item) {
  document.querySelector(".practice-buttons").classList.add("hidden");
  document.getElementById("dueCount").classList.add("hidden");

  const prevBtn = el("button", {
    className: "btn btn-ghost",
    text: "← Previous",
    disabled: session.index === 0,
    onclick: () => goTo(session, session.index - 1),
  });
  const nextBtn = el("button", {
    className: "btn btn-ghost",
    text: "Skip →",
    onclick: () => goTo(session, session.index + 1),
  });

  const knewBtn = el("button", { className: "btn btn-success-outline", text: "✅ I knew it" });
  const didntBtn = el("button", { className: "btn btn-danger-outline", text: "❌ I didn't know it" });
  const feedback = el("div", { className: "practice-feedback hidden" }, [knewBtn, didntBtn]);

  function grade(knewIt) {
    knewBtn.disabled = didntBtn.disabled = true;
    scheduleReview(item.id, knewIt);
    showToast(
      randomItem(knewIt ? KNEW_MESSAGES : DIDNT_KNOW_MESSAGES),
      knewIt ? "success" : "warning"
    );
    advanceTimerId = setTimeout(() => goTo(session, session.index + 1), ADVANCE_DELAY_MS);
  }
  knewBtn.onclick = () => grade(true);
  didntBtn.onclick = () => grade(false);

  const answer = el("details", {}, [
    el("summary", { text: "Show answer" }),
    el("p", { className: "practice-answer", dir: "auto", text: item.translation }),
    ...(item.pronunciation ? [el("p", { className: "pronunciation", text: item.pronunciation })] : []),
    feedback,
  ]);
  answer.addEventListener("toggle", () => {
    if (answer.open) feedback.classList.remove("hidden");
  });

  const box = document.getElementById("practiceArea");
  box.replaceChildren(
    el("div", { className: "practice-card" }, [
      el("div", { className: "practice-nav" }, [
        prevBtn,
        el("span", { className: "counter", text: `${session.index + 1} / ${session.ids.length}` }),
        nextBtn,
      ]),
      el("p", { className: "practice-label", text: "Translate this:" }),
      el("p", { className: "practice-word", dir: "auto", text: item.text }),
      answer,
    ])
  );
  box.classList.remove("hidden");
}
