// admin/admin.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, collection, getDocs, doc, getDoc, updateDoc, addDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
  // Ganti dengan konfigurasi Firebase kamu
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_MSG_ID",
  appId: "YOUR_APP_ID"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth();
const db = getFirestore();

const userTable = document.getElementById("userTable").querySelector("tbody");
const totalKasEl = document.getElementById("totalKas");
const logoutBtn = document.getElementById("logoutBtn");

let totalKasGlobal = 0;

// ⛔ Logout
logoutBtn.addEventListener("click", () => {
  signOut(auth).then(() => {
    window.location.href = "../index.html";
  });
});

// ✅ Cek siapa yang login
onAuthStateChanged(auth, async (user) => {
  if (user) {
    await loadUserData();
  } else {
    window.location.href = "../index.html";
  }
});

// 📦 Load data user dan kas dari Firestore
async function loadUserData() {
  const usersSnapshot = await getDocs(collection(db, "users"));
  userTable.innerHTML = "";
  totalKasGlobal = 0;

  usersSnapshot.forEach(async (userDoc) => {
    const userData = userDoc.data();
    const email = userData.email;
    const kas = userData.kas || 0;

    totalKasGlobal += kas;

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${email}</td>
      <td>Rp${kas.toLocaleString("id-ID")}</td>
      <td>
        <button onclick="inputTransaksi('${userDoc.id}', '${email}', ${kas})">+ Transaksi</button>
      </td>
    `;
    userTable.appendChild(tr);

    totalKasEl.textContent = `Rp${totalKasGlobal.toLocaleString("id-ID")}`;
  });
}

// 🧾 Tambah transaksi
window.inputTransaksi = async function (userId, email, kasLama) {
  const nominal = prompt(`Masukkan nominal transaksi untuk ${email} (gunakan minus untuk kas keluar):`);
  const angka = parseInt(nominal);

  if (!isNaN(angka)) {
    const newKas = kasLama + angka;
    await updateDoc(doc(db, "users", userId), { kas: newKas });

    alert("Transaksi berhasil.");
    loadUserData();
  } else {
    alert("Input tidak valid.");
  }
};
