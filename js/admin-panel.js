import { getDatabase, ref, push, update, get, child } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { firebaseConfig } from './firebase-config.js'; // pastikan ini ada

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const form = document.getElementById("formKas");
const emailSelect = document.getElementById("email");
const kategori = document.getElementById("kategori");
const jumlah = document.getElementById("jumlah");
const keterangan = document.getElementById("keterangan");
const pesan = document.getElementById("pesan");

// Ambil semua user untuk dropdown
async function loadUsers() {
  const dbRef = ref(db);
  const snapshot = await get(child(dbRef, "users"));
  if (snapshot.exists()) {
    const users = snapshot.val();
    for (const uid in users) {
      const email = users[uid].email;
      const option = document.createElement("option");
      option.value = email;
      option.textContent = email;
      emailSelect.appendChild(option);
    }
  }
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const selectedEmail = emailSelect.value;
  const kategoriValue = kategori.value;
  const jumlahValue = parseInt(jumlah.value);
  const keteranganValue = keterangan.value || "-";
  const waktu = new Date().toISOString();

  if (selectedEmail === "all") {
    const snapshot = await get(ref(db, "users"));
    if (snapshot.exists()) {
      const users = snapshot.val();
      for (const uid in users) {
        const user = users[uid];
        const transaksiRef = ref(db, `transaksi/${uid}`);
        await push(transaksiRef, {
          email: user.email,
          kategori: kategoriValue,
          jumlah: jumlahValue,
          keterangan: keteranganValue,
          waktu: waktu
        });

        // Update saldo
        const saldoLama = users[uid].saldo || 0;
        const saldoBaru = kategoriValue === "Pemasukan" ? saldoLama + jumlahValue : saldoLama - jumlahValue;
        await update(ref(db, `users/${uid}`), { saldo: saldoBaru });
      }
      pesan.textContent = "Transaksi untuk semua user berhasil disimpan.";
    }
  } else {
    // Transaksi untuk 1 user saja
    const snapshot = await get(ref(db, "users"));
    if (snapshot.exists()) {
      const users = snapshot.val();
      for (const uid in users) {
        if (users[uid].email === selectedEmail) {
          const transaksiRef = ref(db, `transaksi/${uid}`);
          await push(transaksiRef, {
            email: selectedEmail,
            kategori: kategoriValue,
            jumlah: jumlahValue,
            keterangan: keteranganValue,
            waktu: waktu
          });

          // Update saldo
          const saldoLama = users[uid].saldo || 0;
          const saldoBaru = kategoriValue === "Pemasukan" ? saldoLama + jumlahValue : saldoLama - jumlahValue;
          await update(ref(db, `users/${uid}`), { saldo: saldoBaru });

          pesan.textContent = "Transaksi berhasil untuk user: " + selectedEmail;
          break;
        }
      }
    }
  }

  // Reset form
  form.reset();
  setTimeout(() => { pesan.textContent = ""; }, 3000);
});

loadUsers();
