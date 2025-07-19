// profile.js
import { db, auth, storage } from './firebase-config.js';
import { generateQR, formatRupiah, showNotification } from './utils.js';

export function initProfile() {
  const user = auth.currentUser;
  if (!user) return;
  
  // Tampilkan data profil
  loadProfileData(user);
  
  // Generate QR Code
  generateQR('qrcode', `qcwallet:user:${user.uid}`);
  document.getElementById('user-id').textContent = user.uid;
  
  // Event listener untuk form
  document.getElementById('profile-form').addEventListener('submit', saveProfile);
  
  // Event listener untuk upload avatar
  document.getElementById('avatar-upload').addEventListener('change', uploadAvatar);
}

function loadProfileData(user) {
  // Tampilkan email
  document.getElementById('email').value = user.email || '';
  
  // Load data tambahan dari Firestore
  db.collection('users').doc(user.uid).get()
    .then(doc => {
      if (doc.exists) {
        const userData = doc.data();
        document.getElementById('nama').value = userData.nama || '';
        document.getElementById('phone').value = userData.phone || '';
        document.getElementById('jabatan').value = userData.jabatan || '';
        document.getElementById('profile-saldo').textContent = formatRupiah(userData.saldo || 0);
        
        // Tampilkan avatar jika ada
        if (userData.avatar) {
          document.getElementById('avatar-preview').src = userData.avatar;
        }
      }
    });
}

function saveProfile(e) {
  e.preventDefault();
  
  const user = auth.currentUser;
  if (!user) return;
  
  const userData = {
    nama: document.getElementById('nama').value,
    phone: document.getElementById('phone').value,
    jabatan: document.getElementById('jabatan').value
  };
  
  // Simpan ke Firestore
  db.collection('users').doc(user.uid).update(userData)
    .then(() => {
      showNotification('Profil berhasil disimpan!', 'success');
    })
    .catch(error => {
      showNotification(`Gagal menyimpan: ${error.message}`, 'error');
    });
}

function uploadAvatar(e) {
  const file = e.target.files[0];
  if (!file) return;
  
  const user = auth.currentUser;
  if (!user) return;
  
  // Tampilkan preview
  const reader = new FileReader();
  reader.onload = (event) => {
    document.getElementById('avatar-preview').src = event.target.result;
  };
  reader.readAsDataURL(file);
  
  // Upload ke Firebase Storage
  const storageRef = storage.ref(`avatars/${user.uid}`);
  const uploadTask = storageRef.put(file);
  
  uploadTask.on('state_changed',
    (snapshot) => {
      // Proses upload
    },
    (error) => {
      showNotification(`Upload gagal: ${error.message}`, 'error');
    },
    () => {
      // Upload sukses, dapatkan URL
      uploadTask.snapshot.ref.getDownloadURL().then((downloadURL) => {
        // Simpan URL ke Firestore
        db.collection('users').doc(user.uid).update({ avatar: downloadURL })
          .then(() => {
            showNotification('Foto profil berhasil diubah!', 'success');
          });
      });
    }
  );
}