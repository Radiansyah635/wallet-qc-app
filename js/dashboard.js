// dashboard.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";

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

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Cek siapa yang login
onAuthStateChanged(auth, (user) => {
  if (user) {
    document.getElementById("userEmail").textContent = user.email;
  } else {
    // Kalau belum login, arahkan ke login
    window.location.href = "login.html";
  }
});

// Logout
document.getElementById("logoutBtn").addEventListener("click", () => {
  signOut(auth).then(() => {
    window.location.href = "login.html";
  });
});
