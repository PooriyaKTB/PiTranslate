import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
} from "https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js";
import { firebaseConfig } from "./firebaseConfig.js";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

const FIREBASE_ERRORS = {
  "auth/user-not-found": "No account found with this email.",
  "auth/wrong-password": "Incorrect password.",
  "auth/invalid-email": "Invalid email format.",
  "auth/email-already-in-use": "An account with this email already exists.",
  "auth/weak-password": "Password must be at least 6 characters.",
  "auth/invalid-credential": "Invalid email or password.",
  "auth/too-many-requests": "Too many attempts. Please try again later.",
};

function friendlyError(error) {
  return FIREBASE_ERRORS[error.code] || "Something went wrong. Please try again.";
}

function showError(msg) {
  document.getElementById("error").textContent = msg;
}

function clearError() {
  document.getElementById("error").textContent = "";
}

function validateInputs() {
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

  if (!email) {
    showError("Please enter your email.");
    return null;
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    showError("Please enter a valid email address.");
    return null;
  }
  if (!password) {
    showError("Please enter your password.");
    return null;
  }
  if (password.length < 6) {
    showError("Password must be at least 6 characters.");
    return null;
  }

  return { email, password };
}

function setLoading(button, loading) {
  if (loading) {
    button.dataset.originalText = button.textContent;
    button.textContent = "Loading…";
    button.disabled = true;
  } else {
    button.textContent = button.dataset.originalText || button.textContent;
    button.disabled = false;
  }
}

document.getElementById("loginBtn").addEventListener("click", () => {
  clearError();
  const inputs = validateInputs();
  if (!inputs) return;

  const btn = document.getElementById("loginBtn");
  setLoading(btn, true);

  signInWithEmailAndPassword(auth, inputs.email, inputs.password)
    .then(() => (window.location.href = "app.html"))
    .catch((error) => {
      showError(friendlyError(error));
      setLoading(btn, false);
    });
});

document.getElementById("signupBtn").addEventListener("click", () => {
  clearError();
  const inputs = validateInputs();
  if (!inputs) return;

  const btn = document.getElementById("signupBtn");
  setLoading(btn, true);

  createUserWithEmailAndPassword(auth, inputs.email, inputs.password)
    .then(() => (window.location.href = "app.html"))
    .catch((error) => {
      showError(friendlyError(error));
      setLoading(btn, false);
    });
});

document.getElementById("googleBtn").addEventListener("click", () => {
  clearError();
  const btn = document.getElementById("googleBtn");
  setLoading(btn, true);

  signInWithPopup(auth, provider)
    .then(() => (window.location.href = "app.html"))
    .catch((error) => {
      showError(friendlyError(error));
      setLoading(btn, false);
    });
});

document.getElementById("backHomeBtn").addEventListener("click", () => {
  window.location.href = "index.html";
});

document.getElementById("password").addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    document.getElementById("loginBtn").click();
  }
});
