import { auth, db } from './firebase-config.js';
import {
  createUserWithEmailAndPassword,
} from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";
import {
  setDoc,
  doc,
} from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";

// Event form submit
document.getElementById("register-form").addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = e.target.email.value;
  const password = e.target.password.value;

  try {
    // Buat user di Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Simpan data user ke Firestore
    await setDoc(doc(db, "users", user.uid), {
      email: email,
      role: "user" // default role
    });

    alert("Registrasi berhasil! Silakan login.");
    window.location.href = "login.html";

  } catch (error) {
    console.error("Error registrasi:", error.message);
    alert("Registrasi gagal: " + error.message);
  }
});
