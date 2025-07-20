// admin.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";
import { getFirestore, collection, getDocs, doc, getDoc, updateDoc } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyD0RL0zvv4DL9EBax3XouugVZpkHdzyVNQ",
  authDomain: "wallet-qc-local-storage.firebaseapp.com",
  projectId: "wallet-qc-local-storage",
  storageBucket: "wallet-qc-local-storage.appspot.com",
  messagingSenderId: "443546801664",
  appId: "1:443546801664:web:d520fd8d2f311edd20aae5",
  measurementId: "G-KVKSD7ES9P"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Mengecek apakah user admin sudah login
onAuthStateChanged(auth, (user) => {
  if (user) {
    loadUserData();
  } else {
    window.location.href = "../index.html";
  }
});

// Fungsi logout
document.getElementById("logoutBtn").addEventListener("click", () => {
  signOut(auth).then(() => {
    window.location.href = "../index.html";
  });
});

// Menampilkan data user
async function loadUserData() {
  const usersRef = collection(db, "users");
  const userTableBody = document.querySelector("#userTable tbody");
  userTableBody.innerHTML = "";

  let totalKas = 0;

  const querySnapshot = await getDocs(usersRef);
  querySnapshot.forEach(async (docSnap) => {
    const userData = docSnap.data();
    const row = document.createElement("tr");

    const emailCell = document.createElement("td");
    emailCell.textContent = userData.email || "Tidak ada email";
    row.appendChild(emailCell);

    const saldoCell = document.createElement("td");
    const kas = userData.saldo || 0;
    saldoCell.textContent = `Rp${kas.toLocaleString("id-ID")}`;
    row.appendChild(saldoCell);

    const actionCell = document.createElement("td");
    const inputBtn = document.createElement("button");
    inputBtn.textContent = "Input Transaksi";
    inputBtn.addEventListener("click", () => {
      const nominal = prompt("Masukkan nominal transaksi:");
      if (nominal && !isNaN(nominal)) {
        updateUserSaldo(docSnap.id, parseInt(nominal));
      }
    });
    actionCell.appendChild(inputBtn);
    row.appendChild(actionCell);

    userTableBody.appendChild(row);
    totalKas += kas;

    // Update total kas
    document.getElementById("totalKas").textContent = `Rp${totalKas.toLocaleString("id-ID")}`;
  });
}

// Update saldo user
async function updateUserSaldo(userId, nominal) {
  const userDocRef = doc(db, "users", userId);
  const userDocSnap = await getDoc(userDocRef);
  if (userDocSnap.exists()) {
    const currentSaldo = userDocSnap.data().saldo || 0;
    const newSaldo = currentSaldo + nominal;
    await updateDoc(userDocRef, { saldo: newSaldo });
    alert("Saldo berhasil diperbarui");
    loadUserData();
  }
}
