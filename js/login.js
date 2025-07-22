import { auth, db } from './firebase-config.js';
import {
  signInWithEmailAndPassword,
} from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";
import {
  doc,
  getDoc,
} from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";

// Login form event
document.getElementById("login-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  
  const email = e.target.email.value;
  const password = e.target.password.value;

  try {
    // Login ke Firebase
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Ambil role dari Firestore
    const userDocRef = doc(db, "users", user.uid);
    const userDocSnap = await getDoc(userDocRef);

    if (userDocSnap.exists()) {
      const role = userDocSnap.data().role;

      // Redirect sesuai role
      if (role === "admin") {
        window.location.href = "admin-dashboard.html";
      } else {
        window.location.href = "dashboard.html";
      }

    } else {
      // Jika user tidak terdaftar di koleksi 'users'
      alert("Akun belum lengkap, silakan daftar ulang.");
      window.location.href = "register.html";
    }

  } catch (error) {
    console.error("Login Error:", error.message);
    alert("Login gagal: " + error.message);
  }
});
