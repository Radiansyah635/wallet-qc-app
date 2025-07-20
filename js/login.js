// Import Firebase Auth dan Firestore
import { getAuth, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { app } from "./firebase-config.js"; // Harus pastikan app dari sini cocok dengan firebaseConfig

// Konfigurasi (kalau belum diekspor dari firebase-config.js, pakai ini)
const firebaseConfig = {
  apiKey: "AIzaSyD0RL0zvv4DL9EBax3XouugVZpkHdzyVNQ",
  authDomain: "wallet-qc-local-storage.firebaseapp.com",
  projectId: "wallet-qc-local-storage",
  storageBucket: "wallet-qc-local-storage.appspot.com",
  messagingSenderId: "443546801664",
  appId: "1:443546801664:web:d520fd8d2f311edd20aae5"
};

const auth = getAuth(app);
const db = getFirestore(app);

// Event listener untuk form login
document.getElementById("loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const uid = userCredential.user.uid;

    // Ambil role user dari Firestore berdasarkan uid
    const userDoc = await getDoc(doc(db, "users", uid));
    const userData = userDoc.data();

    // Arahkan berdasarkan role
    if (userData && userData.role === "admin") {
      window.location.href = "admin.html";
    } else {
      window.location.href = "dashboard.html";
    }

  } catch (error) {
    alert("Login gagal: " + error.message);
  }
});
