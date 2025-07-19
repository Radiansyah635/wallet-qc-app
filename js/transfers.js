import { db, auth } from './firebase-config.js';
import { formatRupiah, showNotification, generateQR } from './utils.js';
import QRScanner from './qr-scanner.js';

export function initTransfer() {
  // Generate QR untuk user saat ini
  generateQR('my-qr-code', `qcwallet:user:${auth.currentUser.uid}`);
  
  // Setup QR scanner
  const scanBtn = document.getElementById('btn-scan-qr');
  const videoElem = document.getElementById('qr-scanner-video');
  
  if (scanBtn && videoElem) {
    const scanner = new QRScanner(videoElem);
    
    scanBtn.addEventListener('click', () => {
      scanner.start(result => {
        // Format: qcwallet:user:{userID}
        const parts = result.split(':');
        if (parts.length === 3 && parts[0] === 'qcwallet' && parts[1] === 'user') {
          document.getElementById('recipient-id').value = parts[2];
          loadRecipientInfo(parts[2]);
        }
      });
    });
  }
  
  // Setup form transfer
  document.getElementById('transfer-form').addEventListener('submit', processTransfer);
}

async function loadRecipientInfo(userId) {
  const userDoc = await db.collection('users').doc(userId).get();
  if (userDoc.exists) {
    const user = userDoc.data();
    document.getElementById('recipient-name').textContent = user.nama || 'User';
    document.getElementById('recipient-avatar').src = user.avatar || 'https://i.pravatar.cc/150?img=3';
  }
}

async function processTransfer(e) {
  e.preventDefault();
  
  const sender = auth.currentUser;
  const recipientId = document.getElementById('recipient-id').value;
  const amount = parseFloat(document.getElementById('transfer-amount').value);
  const note = document.getElementById('transfer-note').value;
  
  // Validasi
  if (!recipientId) {
    showNotification('Pilih penerima terlebih dahulu', 'error');
    return;
  }
  
  if (!amount || amount <= 0) {
    showNotification('Masukkan jumlah yang valid', 'error');
    return;
  }
  
  // Cek saldo pengirim
  const senderDoc = await db.collection('users').doc(sender.uid).get();
  const senderBalance = senderDoc.data().saldo || 0;
  
  if (senderBalance < amount) {
    showNotification('Saldo tidak mencukupi', 'error');
    return;
  }
  
  // Buat transaksi pengirim
  const senderTransaction = {
    userId: sender.uid,
    jenis: 'transfer',
    nominal: amount,
    penerima: recipientId,
    keterangan: note || `Transfer ke ${recipientId}`,
    tanggal: new Date()
  };
  
  // Buat transaksi penerima
  const recipientTransaction = {
    userId: recipientId,
    jenis: 'pemasukan',
    nominal: amount,
    pengirim: sender.uid,
    keterangan: note || `Transfer dari ${sender.uid}`,
    tanggal: new Date()
  };
  
  // Batch write
  const batch = db.batch();
  
  // Transaksi pengirim
  const senderRef = db.collection('transactions').doc();
  batch.set(senderRef, senderTransaction);
  
  // Transaksi penerima
  const recipientRef = db.collection('transactions').doc();
  batch.set(recipientRef, recipientTransaction);
  
  // Update saldo pengirim
  const senderUpdate = db.collection('users').doc(sender.uid);
  batch.update(senderUpdate, {
    saldo: firebase.firestore.FieldValue.increment(-amount)
  });
  
  // Update saldo penerima
  const recipientUpdate = db.collection('users').doc(recipientId);
  batch.update(recipientUpdate, {
    saldo: firebase.firestore.FieldValue.increment(amount)
  });
  
  // Eksekusi batch
  batch.commit()
    .then(() => {
      showNotification('Transfer berhasil!', 'success');
      document.getElementById('transfer-form').reset();
    })
    .catch(error => {
      showNotification(`Gagal transfer: ${error.message}`, 'error');
    });
}