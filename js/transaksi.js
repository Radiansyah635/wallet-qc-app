// transaksi.js
import { db, auth, storage } from './firebase-config.js';
import { formatRupiah, formatDate, showNotification } from './utils.js';
import QRScanner from './qr-scanner.js'; // Asumsikan kita punya modul scanner

export function initTransaksi() {
  const user = auth.currentUser;
  if (!user) return;
  
  // Periksa role user
  checkUserRole();
  
  // Load data user untuk transfer
  loadUserDataForTransfer();
  
  // Setup form transaksi
  setupTransactionForm();
  
  // Load riwayat transaksi
  loadTransactionHistory();
  
  // Setup event listeners
  document.getElementById('jenis-transaksi').addEventListener('change', toggleTransferSection);
  document.getElementById('btn-scan').addEventListener('click', startQRScanner);
  document.getElementById('btn-export').addEventListener('click', exportToPDF);
}

function checkUserRole() {
  db.collection('users').doc(auth.currentUser.uid).get()
    .then(doc => {
      if (doc.exists && doc.data().role === 'admin') {
        // Tampilkan pilihan user untuk admin
        document.getElementById('admin-user-select').style.display = 'block';
        loadAllUsers();
      }
    });
}

function loadAllUsers() {
  const select = document.getElementById('user-select');
  select.innerHTML = '<option value="">Pilih User</option>';
  
  db.collection('users').get().then(snapshot => {
    snapshot.forEach(doc => {
      const user = doc.data();
      const option = document.createElement('option');
      option.value = doc.id;
      option.textContent = `${user.nama} (${user.email})`;
      select.appendChild(option);
    });
  });
}

function toggleTransferSection() {
  const jenis = document.getElementById('jenis-transaksi').value;
  const transferSection = document.getElementById('transfer-section');
  
  if (jenis === 'transfer') {
    transferSection.style.display = 'block';
  } else {
    transferSection.style.display = 'none';
    document.getElementById('qr-scanner').style.display = 'none';
  }
}

function loadUserDataForTransfer() {
  const select = document.getElementById('tujuan-transfer');
  select.innerHTML = '<option value="">Pilih User Tujuan</option>';
  
  db.collection('users').get().then(snapshot => {
    snapshot.forEach(doc => {
      // Skip user saat ini
      if (doc.id === auth.currentUser.uid) return;
      
      const user = doc.data();
      const option = document.createElement('option');
      option.value = doc.id;
      option.textContent = `${user.nama} (${user.email})`;
      select.appendChild(option);
    });
  });
}

function startQRScanner() {
  const scannerDiv = document.getElementById('qr-scanner');
  const video = document.getElementById('scanner-video');
  
  if (scannerDiv.style.display === 'none') {
    scannerDiv.style.display = 'block';
    QRScanner.start(video, result => {
      // Format: qcwallet:user:{userID}
      const userId = result.split(':')[2];
      document.getElementById('tujuan-transfer').value = userId;
      scannerDiv.style.display = 'none';
    });
  } else {
    scannerDiv.style.display = 'none';
    QRScanner.stop();
  }
}

function setupTransactionForm() {
  document.getElementById('transaksi-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const user = auth.currentUser;
    const jenis = document.getElementById('jenis-transaksi').value;
    const nominal = parseFloat(document.getElementById('nominal').value);
    const keterangan = document.getElementById('keterangan').value;
    const buktiFile = document.getElementById('bukti').files[0];
    
    // Tentukan user target (untuk admin)
    let userId = user.uid;
    if (document.getElementById('admin-user-select').style.display === 'block') {
      const selectedUser = document.getElementById('user-select').value;
      if (selectedUser) userId = selectedUser;
    }
    
    // Data dasar transaksi
    const transactionData = {
      userId,
      jenis,
      nominal,
      keterangan,
      tanggal: new Date(),
      status: 'selesai'
    };
    
    // Handle transfer
    if (jenis === 'transfer') {
      const penerimaId = document.getElementById('tujuan-transfer').value;
      if (!penerimaId) {
        showNotification('Pilih user tujuan transfer', 'error');
        return;
      }
      
      transactionData.penerima = penerimaId;
      
      // Validasi saldo cukup
      const userDoc = await db.collection('users').doc(userId).get();
      const saldo = userDoc.data().saldo || 0;
      
      if (saldo < nominal) {
        showNotification('Saldo tidak cukup untuk transfer', 'error');
        return;
      }
    }
    
    // Upload bukti transaksi jika ada
    if (buktiFile) {
      const storageRef = storage.ref(`bukti_transaksi/${Date.now()}_${buktiFile.name}`);
      const uploadTask = storageRef.put(buktiFile);
      
      uploadTask.on('state_changed',
        null,
        error => showNotification(`Upload bukti gagal: ${error.message}`, 'error'),
        async () => {
          const downloadURL = await uploadTask.snapshot.ref.getDownloadURL();
          transactionData.bukti = downloadURL;
          saveTransaction(transactionData, jenis);
        }
      );
    } else {
      saveTransaction(transactionData, jenis);
    }
  });
}

function saveTransaction(data, jenis) {
  // Simpan transaksi
  db.collection('transactions').add(data)
    .then(() => {
      // Update saldo user
      updateUserBalance(data.userId, data.jenis, data.nominal);
      
      // Jika transfer, tambahkan transaksi untuk penerima
      if (jenis === 'transfer' && data.penerima) {
        const penerimaTransaction = {
          userId: data.penerima,
          jenis: 'pemasukan',
          nominal: data.nominal,
          keterangan: `Transfer dari ${data.userId}`,
          tanggal: new Date(),
          pengirim: data.userId
        };
        
        db.collection('transactions').add(penerimaTransaction)
          .then(() => {
            updateUserBalance(data.penerima, 'pemasukan', data.nominal);
          });
      }
      
      showNotification('Transaksi berhasil disimpan!', 'success');
      document.getElementById('transaksi-form').reset();
    })
    .catch(error => {
      showNotification(`Gagal menyimpan transaksi: ${error.message}`, 'error');
    });
}

function updateUserBalance(userId, jenis, nominal) {
  const increment = jenis === 'pemasukan' ? nominal : -nominal;
  
  db.collection('users').doc(userId).update({
    saldo: firebase.firestore.FieldValue.increment(increment)
  });
}

function loadTransactionHistory() {
  const user = auth.currentUser;
  const list = document.getElementById('riwayat-transaksi');
  
  let query = db.collection('transactions')
    .where('userId', '==', user.uid)
    .orderBy('tanggal', 'desc');
  
  // Untuk admin, tampilkan semua transaksi
  if (userData && userData.role === 'admin') {
    query = db.collection('transactions').orderBy('tanggal', 'desc');
  }
  
  query.onSnapshot(snapshot => {
    list.innerHTML = '';
    
    if (snapshot.empty) {
      list.innerHTML = '<div class="transaction-item"><div class="transaction-details">Tidak ada transaksi</div></div>';
      return;
    }
    
    snapshot.forEach(doc => {
      const trans = doc.data();
      const item = document.createElement('div');
      item.className = 'transaction-item';
      
      let icon = '↔';
      let typeClass = '';
      
      if (trans.jenis === 'pemasukan') {
        icon = '↑';
        typeClass = 'positive';
      } else if (trans.jenis === 'pengeluaran') {
        icon = '↓';
        typeClass = 'negative';
      } else if (trans.jenis === 'transfer') {
        icon = '→';
        typeClass = 'negative';
      }
      
      item.innerHTML = `
        <div class="transaction-icon">${icon}</div>
        <div class="transaction-details">
          <div class="transaction-title">${trans.keterangan || 'Transaksi'}</div>
          <div class="transaction-meta">
            <span class="transaction-date">${formatDate(trans.tanggal)}</span>
            ${trans.penerima ? `<span class="transaction-recipient">→ ${trans.penerima}</span>` : ''}
          </div>
        </div>
        <div class="transaction-amount ${typeClass}">
          ${trans.jenis === 'pemasukan' ? '+' : '-'}${formatRupiah(trans.nominal)}
        </div>
      `;
      
      list.appendChild(item);
    });
  });
}

function exportToPDF() {
  // Implementasi PDF.js atau library lain
  showNotification('Fitur export PDF belum diimplementasi', 'warning');
}