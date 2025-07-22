// auth.js
import { auth, db } from './firebase-config.js';
import {
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";

import {
  getDoc,
  doc
} from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";

// Cek apakah user login dan dapatkan role-nya
onAuthStateChanged(auth, async (user) => {
  const currentPath = window.location.pathname;

  if (user) {
    const userRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userRef);
    const userData = userSnap.data();

    // Jika user sedang di halaman login atau register, arahkan ke dashboard
    if (currentPath.includes("login.html") || currentPath.includes("register.html") || currentPath.includes("index.html")) {
      if (userData?.role === "admin") {
        window.location.href = "admin-dashboard.html";
      } else {
        window.location.href = "dashboard.html";
      }
    }

    // Jika halaman dashboard, boleh lanjut (tidak dialihkan)
  } else {
    // Tidak login, jika halaman butuh login arahkan ke login
    const allowedPages = ["login.html", "register.html", "index.html"];
    const isAllowed = allowedPages.some(p => currentPath.includes(p));

    if (!isAllowed) {
      window.location.href = "login.html";
    }
  }
});

// Fungsi logout (bisa dipanggil dari tombol logout)
export function logoutUser() {
  signOut(auth)
    .then(() => {
      window.location.href = "login.html";
    })
    .catch((error) => {
      console.error("Logout error:", error);
    });
      }
