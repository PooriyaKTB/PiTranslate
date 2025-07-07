import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup
} from "https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js";
import { firebaseConfig } from "./firebaseConfig.js";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

document.getElementById("submitBtn").addEventListener("click", () => {
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

  signInWithEmailAndPassword(auth, email, password)
    .then(() => window.location.href = "app.html")
    .catch((error) => {
      if (error.code === "auth/user-not-found") {
        createUserWithEmailAndPassword(auth, email, password)
          .then(() => window.location.href = "app.html")
          .catch(err => showError(err.message));
      } else {
        showError(error.message);
      }
    });
});

document.getElementById("googleBtn").addEventListener("click", () => {
  signInWithPopup(auth, provider)
    .then(() => window.location.href = "app.html")
    .catch(err => showError(err.message));
});

function showError(msg) {
  document.getElementById("error").textContent = msg;
}
