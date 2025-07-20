// login.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";

// ✅ Inisialisasi Firebase dulu
const firebaseConfig = {
  apiKey: "AIzaSyD0RL0zvv4DL9EBax3XouugVZpkHdzyVNQ",
  authDomain: "wallet-qc-local-storage.firebaseapp.com",
  projectId: "wallet-qc-local-storage",
  storageBucket: "wallet-qc-local-storage.appspot.com",
  messagingSenderId: "443546801664",
  appId: "1:443546801664:web:d520fd8d2f311edd20aae5"
};

// 🔥 Jangan lupa definisikan 'app' dulu sebelum dipakai
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Login Event
document.getElementById("loginForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  signInWithEmailAndPassword(auth, email, password)
    .then((userCredential) => {
      const user = userCredential.user;
      alert("Login berhasil!");
      window.location.href = "dashboard.html";
    })
    .catch((error) => {
      alert("Login gagal: " + error.message);
    });
});
