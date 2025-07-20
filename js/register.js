// register.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";

// Konfigurasi Firebase
const firebaseConfig = {
  apiKey: "AIzaSyD0RL0zvv4DL9EBax3XouugVZpkHdzyVNQ",
  authDomain: "wallet-qc-local-storage.firebaseapp.com",
  databaseURL: "https://wallet-qc-local-storage-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "wallet-qc-local-storage",
  storageBucket: "wallet-qc-local-storage.firebasestorage.app",
  messagingSenderId: "443546801664",
  appId: "1:443546801664:web:d520fd8d2f311edd20aae5",
  measurementId: "G-KVKSD7ES9P"
};

// Inisialisasi Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Tangani Form Register
document.getElementById('registerForm').addEventListener('submit', (e) => {
  e.preventDefault();

  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value.trim();
  const message = document.getElementById('message');

  createUserWithEmailAndPassword(auth, email, password)
    .then((userCredential) => {
      message.textContent = "Berhasil mendaftar! Silakan login.";
      message.classList.remove('text-red-500');
      message.classList.add('text-green-500');
    })
    .catch((error) => {
      message.textContent = error.message;
      message.classList.remove('text-green-500');
      message.classList.add('text-red-500');
    });
});
