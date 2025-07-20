// chart.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";
import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

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
const db = getFirestore(app);

async function fetchTransaksi() {
  const transaksiRef = collection(db, "transaksi");
  const snapshot = await getDocs(transaksiRef);
  const data = {};

  snapshot.forEach((doc) => {
    const transaksi = doc.data();
    const tanggal = transaksi.tanggal || "Tidak diketahui";
    const jumlah = parseFloat(transaksi.jumlah) || 0;

    if (!data[tanggal]) {
      data[tanggal] = 0;
    }

    data[tanggal] += jumlah;
  });

  return data;
}

function tampilkanChart(dataKas) {
  const ctx = document.getElementById('grafikKas').getContext('2d');

  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: Object.keys(dataKas),
      datasets: [{
        label: 'Total Kas per Tanggal',
        data: Object.values(dataKas),
        backgroundColor: 'rgba(75, 192, 192, 0.7)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 2
      }]
    },
    options: {
      scales: {
        y: {
          beginAtZero: true
        }
      }
    }
  });
}

// Inisialisasi
fetchTransaksi().then(data => {
  tampilkanChart(data);
});
