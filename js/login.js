// login.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

const firebaseConfig = {
  apiKey: "API_KEY_KAMU",
  authDomain: "PROJEK.firebaseapp.com",
  projectId: "PROJEK_ID",
  storageBucket: "PROJEK.appspot.com",
  messagingSenderId: "XXXXXX",
  appId: "APP_ID"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Jalankan setelah DOM siap
document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;

      signInWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
          // Login berhasil
          alert("Login berhasil!");
          window.location.href = "dashboard.html";
        })
        .catch((error) => {
          alert("Email atau password salah");
          console.error(error);
        });
    });
  }
});
