// Single place for the Firebase SDK version and config.
// The config's apiKey is a public client identifier, not a secret.
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-auth.js";

export {
  onAuthStateChanged,
  signOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  sendPasswordResetEmail,
  GoogleAuthProvider,
  signInWithPopup,
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyAP35dyrD3OfYyBMXJiR-D_c7S8wEsH_o0",
  authDomain: "p-itranslate.firebaseapp.com",
  projectId: "p-itranslate",
  storageBucket: "p-itranslate.appspot.com",
  messagingSenderId: "754345992605",
  appId: "1:754345992605:web:141d1febc9f12081690f74",
  measurementId: "G-ZY3H1VWR59",
};

export const auth = getAuth(initializeApp(firebaseConfig));
