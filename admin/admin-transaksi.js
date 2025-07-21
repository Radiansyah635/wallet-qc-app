import { initializeApp } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

// Firebase Config
const firebaseConfig = {
  apiKey: "AIzaSyD0RL0zvv4DL9EBax3XouugVZpkHdzyVNQ",
  authDomain: "wallet-qc-local-storage.firebaseapp.com",
  projectId: "wallet-qc-local-storage"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Load user ke dropdown
async function loadUsers() {
  const snapshot = await getDocs(collection(db, "users"));
  const select = document.getElementById("userSelect");
  snapshot.forEach((docu) => {
    const user = docu.data();
    const option = document.createElement("option");
    option.value = docu.id;
    option.textContent = user.nama;
    select.appendChild(option);
  });
}

loadUsers();

// Submit transaksi
document.getElementById("transaksiForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const userId = document.getElementById("userSelect").value;
  const tipe = document.getElementById("tipeTransaksi").value;
  const jumlah = parseFloat(document.getElementById("jumlahTransaksi").value);
  const deskripsi = document.getElementById("deskripsiTransaksi").value;
  const tanggal = new Date().toISOString().split("T")[0];

  const transaksiRef = collection(db, "transaksi");

  await addDoc(transaksiRef, {
    userId,
    tipe,
    jumlah: tipe === "keluar" ? -Math.abs(jumlah) : jumlah,
    deskripsi,
    tanggal,
    waktu: new Date()
  });

  // Update saldo user
  const userDoc = doc(db, "users", userId);
  const userData = (await getDocs(collection(db, "users"))).docs.find(d => d.id === userId).data();
  const saldoBaru = (userData.saldo || 0) + (tipe === "keluar" ? -Math.abs(jumlah) : jumlah);

  await updateDoc(userDoc, { saldo: saldoBaru });

  alert("Transaksi berhasil ditambahkan!");
  e.target.reset();
  window.location.href = "../admin/dashboard.html";
});
