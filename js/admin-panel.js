// admin-panel.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";
import { getFirestore, collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

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
const db = getFirestore(app);

// Tangani Form Input
document.getElementById("formKas").addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = document.getElementById("email").value.trim();
  const kategori = document.getElementById("kategori").value;
  const jumlah = parseInt(document.getElementById("jumlah").value);
  const keterangan = document.getElementById("keterangan").value.trim();
  const pesan = document.getElementById("pesan");

  try {
    await addDoc(collection(db, "transaksi_kas"), {
      email,
      kategori,
      jumlah,
      keterangan,
      tanggal: serverTimestamp()
    });
    pesan.textContent = "✅ Transaksi berhasil disimpan!";
    document.getElementById("formKas").reset();
  } catch (err) {
    pesan.textContent = "❌ Gagal menyimpan: " + err.message;
    pesan.classList.remove("text-green-600");
    pesan.classList.add("text-red-600");
  }
});
