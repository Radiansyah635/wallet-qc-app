// login.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";

// Konfigurasi Firebase
const firebaseConfig = {
  apiKey: "AIzaSyD0RL0zvv4DL9EBax3XouugVZpkHdzyVNQ",
  authDomain: "wallet-qc-local-storage.firebaseapp.com",
  projectId: "wallet-qc-local-storage",
  storageBucket: "wallet-qc-local-storage.appspot.com",
  messagingSenderId: "443546801664",
  appId: "1:443546801664:web:d520fd8d2f311edd20aae5"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Cek jika form login ada
const loginForm = document.getElementById('loginForm');
if (loginForm) {
  loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value.trim();
    const message = document.getElementById('message');

    signInWithEmailAndPassword(auth, email, password)
      .then((userCredential) => {
        message.textContent = "Login berhasil! Mengalihkan...";
        message.classList.remove('text-red-500');
        message.classList.add('text-green-500');
        setTimeout(() => {
          window.location.href = "dashboard.html";
        }, 1500);
      })
      .catch((error) => {
        message.textContent = error.message;
        message.classList.remove('text-green-500');
        message.classList.add('text-red-500');
      });
  });
}
