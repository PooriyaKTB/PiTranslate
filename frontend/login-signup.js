import {
  auth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  sendPasswordResetEmail,
  GoogleAuthProvider,
  signInWithPopup,
} from "./firebase.js";
import { fillLanguageSelect, getLangName, saveLang } from "./languages.js";

const provider = new GoogleAuthProvider();

const FIREBASE_ERRORS = {
  "auth/invalid-credential": "Incorrect email or password.",
  "auth/invalid-email": "Invalid email format.",
  "auth/missing-email": "Please enter your email.",
  "auth/email-already-in-use": "An account with this email already exists.",
  "auth/weak-password": "Password must be at least 6 characters.",
  "auth/too-many-requests": "Too many attempts. Please try again later.",
  "auth/network-request-failed": "Network error. Check your connection.",
  "auth/popup-blocked": "The Google sign-in popup was blocked by the browser.",
  "auth/unauthorized-domain": "Sign-in isn't enabled for this site's domain.",
};

// The user closed the Google popup themselves — not an error worth showing.
const SILENT_ERRORS = ["auth/popup-closed-by-user", "auth/cancelled-popup-request"];

const form = document.getElementById("authForm");
const errorEl = document.getElementById("error");
const infoEl = document.getElementById("info");
const nameInput = document.getElementById("name");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const languageSelect = document.getElementById("language");

fillLanguageSelect(languageSelect, "Choose a language");

function showError(msg) {
  infoEl.textContent = "";
  errorEl.textContent = msg;
}

function showInfo(msg) {
  errorEl.textContent = "";
  infoEl.textContent = msg;
}

function fail(msg) {
  showError(msg);
  return null;
}

function setMode(mode) {
  form.dataset.mode = mode;
  passwordInput.autocomplete = mode === "signup" ? "new-password" : "current-password";
  showError("");
}

function isSignup() {
  return form.dataset.mode === "signup";
}

function errorMessage(error, fallback = "Something went wrong. Please try again.") {
  return FIREBASE_ERRORS[error.code] || fallback;
}

function validEmail() {
  const email = emailInput.value.trim();
  if (!email) return fail("Please enter your email.");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return fail("Please enter a valid email address.");
  }
  return email;
}

function validInputs() {
  const name = nameInput.value.trim();
  if (isSignup() && !name) return fail("Please enter your name.");

  const email = validEmail();
  if (!email) return null;

  const password = passwordInput.value;
  if (!password) return fail("Please enter your password.");
  if (password.length < 6) return fail("Password must be at least 6 characters.");

  const language = languageSelect.value;
  if (isSignup() && !getLangName(language)) {
    return fail("Please choose the language to translate into.");
  }
  return { name, email, password, language };
}

let busy = false;

// Shows a loading state on the button while the action runs.
async function withLoading(button, action) {
  showError("");
  const originalContent = [...button.childNodes];
  button.textContent = "Loading…";
  button.disabled = true;
  try {
    return await action();
  } finally {
    button.replaceChildren(...originalContent);
    button.disabled = false;
  }
}

async function signIn(button, action) {
  busy = true;
  try {
    await withLoading(button, action);
    window.location.href = "app.html";
  } catch (error) {
    busy = false;
    if (!SILENT_ERRORS.includes(error.code)) showError(errorMessage(error));
  }
}

async function sendReset(button) {
  const email = validEmail();
  if (!email) return;
  try {
    await withLoading(button, () => sendPasswordResetEmail(auth, email));
    // Same message whether or not the account exists (no email enumeration).
    showInfo("If an account exists for this email, a reset link has been sent. Check your inbox.");
  } catch (error) {
    showError(errorMessage(error, "Couldn't send the reset email. Please try again."));
  }
}

// Already signed in when the page opens → straight to the app.
auth.authStateReady().then(() => {
  if (auth.currentUser && !busy) window.location.href = "app.html";
});

setMode(new URLSearchParams(location.search).get("mode") === "signup" ? "signup" : "login");

form.querySelectorAll("[data-switch]").forEach((link) =>
  link.addEventListener("click", () => setMode(link.dataset.switch))
);

form.addEventListener("submit", (e) => {
  e.preventDefault();
  const button = document.getElementById("submitBtn");
  if (form.dataset.mode === "reset") {
    sendReset(button);
    return;
  }

  const inputs = validInputs();
  if (!inputs) return;

  if (!isSignup()) {
    signIn(button, () => signInWithEmailAndPassword(auth, inputs.email, inputs.password));
    return;
  }

  signIn(button, async () => {
    const { user } = await createUserWithEmailAndPassword(auth, inputs.email, inputs.password);
    saveLang(inputs.language);
    // The account already exists at this point; a missing display name isn't worth failing over.
    await updateProfile(user, { displayName: inputs.name }).catch(() => {});
  });
});

document.getElementById("googleBtn").addEventListener("click", (e) => {
  signIn(e.currentTarget, () => signInWithPopup(auth, provider));
});

document.getElementById("backHomeBtn").addEventListener("click", () => {
  window.location.href = "index.html";
});
