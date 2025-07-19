import { db, auth } from './firebase-config.js';
import { formatRupiah, formatDate, showNotification } from './utils.js';

// Inisialisasi Admin Panel
export function initAdminPanel() {
  // Pastikan user adalah admin
  verifyAdminRole();
  
  // Setup menu navigasi
  setupAdminMenu();
  
  // Load data dashboard
  loadDashboardStats();
  
  // Load data user
  loadUserList();
  
  // Setup form user
  setupUserForm();
  
  // Load data transaksi
  loadAllTransactions();
  
  // Load data agenda
  loadAllAgendas();
  
  // Load data sosial
  loadAllSocialPosts();
  
  // Setup pengaturan sistem
  setupSystemSettings();
}

// Verifikasi bahwa user adalah admin
async function verifyAdminRole() {
  const user = auth.currentUser;
  if (!user) {
    showNotification('Akses ditolak: Silakan login terlebih dahulu', 'error');
    loadComponent('login');
    return;
  }
  
  const userDoc = await db.collection('users').doc(user.uid).get();
  if (!userDoc.exists || userDoc.data().role !== 'admin') {
    showNotification('Akses ditolak: Anda bukan admin', 'error');
    loadComponent('dashboard');
    return;
  }
}

// Setup menu navigasi admin
function setupAdminMenu() {
  const menuBtns = document.querySelectorAll('.admin-menu-btn');
  const sections = document.querySelectorAll('.admin-section');
  
  menuBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      // Hapus active dari semua tombol dan section
      menuBtns.forEach(b => b.classList.remove('active'));
      sections.forEach(s => s.classList.remove('active'));
      
      // Tambahkan active ke tombol yang diklik
      btn.classList.add('active');
      
      // Tampilkan section yang sesuai
      const target = btn.dataset.target;
      document.getElementById(target).classList.add('active');
    });
  });
}

// Load statistik dashboard
function loadDashboardStats() {
  // Total saldo semua user
  db.collection('users').get().then(snapshot => {
    let totalSaldo = 0;
    snapshot.forEach(doc => {
      totalSaldo += doc.data().saldo || 0;
    });
    document.getElementById('total-saldo-qc').textContent = formatRupiah(totalSaldo);
    document.getElementById('total-user').textContent = snapshot.size;
  });
  
  // Transaksi hari ini
  const today = new Date();
  const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  
  db.collection('transactions')
    .where('tanggal', '>=', startOfDay)
    .get()
    .then(snapshot => {
      document.getElementById('transaksi-hari-ini').textContent = snapshot.size;
    });
  
  // Agenda aktif
  db.collection('agenda')
    .where('tanggal', '>=', new Date())
    .get()
    .then(snapshot => {
      document.getElementById('agenda-aktif').textContent = snapshot.size;
    });
}

// Load daftar user
function loadUserList() {
  const userList = document.getElementById('user-list');
  userList.innerHTML = '<tr><td colspan="6">Memuat data user...</td></tr>';
  
  db.collection('users').get().then(snapshot => {
    if (snapshot.empty) {
      userList.innerHTML = '<tr><td colspan="6">Tidak ada user</td></tr>';
      return;
    }
    
    userList.innerHTML = '';
    snapshot.forEach(doc => {
      const user = doc.data();
      const row = document.createElement('tr');
      
      row.innerHTML = `
        <td>${user.nama || '-'}</td>
        <td>${user.email || '-'}</td>
        <td><span class="role-badge ${user.role}">${user.role}</span></td>
        <td>${formatRupiah(user.saldo || 0)}</td>
        <td><span class="status-badge active">Aktif</span></td>
        <td>
          <button class="btn-edit-user" data-id="${doc.id}">✏️ Edit</button>
          <button class="btn-delete-user" data-id="${doc.id}">🗑️ Hapus</button>
        </td>
      `;
      
      // Tambahkan event listener untuk edit
      row.querySelector('.btn-edit-user').addEventListener('click', () => {
        openUserModal(doc.id, user);
      });
      
      // Tambahkan event listener untuk hapus
      row.querySelector('.btn-delete-user').addEventListener('click', () => {
        deleteUser(doc.id, user.nama);
      });
      
      userList.appendChild(row);
    });
  });
}

// Setup form user
function setupUserForm() {
  const modal = document.getElementById('user-modal');
  const closeBtn = modal.querySelector('.modal-close');
  const addUserBtn = document.getElementById('btn-add-user');
  
  // Buka modal tambah user
  addUserBtn.addEventListener('click', () => {
    document.getElementById('user-modal-title').textContent = 'Tambah User Baru';
    document.getElementById('user-form').reset();
    document.getElementById('edit-user-id').value = '';
    modal.style.display = 'block';
  });
  
  // Tutup modal
  closeBtn.addEventListener('click', () => {
    modal.style.display = 'none';
  });
  
  // Submit form user
  document.getElementById('user-form').addEventListener('submit', (e) => {
    e.preventDefault();
    saveUser();
  });
}

// Buka modal edit user
function openUserModal(userId, userData) {
  const modal = document.getElementById('user-modal');
  
  document.getElementById('user-modal-title').textContent = 'Edit User';
  document.getElementById('edit-user-id').value = userId;
  document.getElementById('user-name').value = userData.nama || '';
  document.getElementById('user-email').value = userData.email || '';
  document.getElementById('user-role').value = userData.role || 'user';
  document.getElementById('user-saldo').value = userData.saldo || 0;
  
  modal.style.display = 'block';
}

// Simpan/update user
function saveUser() {
  const userId = document.getElementById('edit-user-id').value;
  const name = document.getElementById('user-name').value;
  const email = document.getElementById('user-email').value;
  const role = document.getElementById('user-role').value;
  const saldo = parseFloat(document.getElementById('user-saldo').value) || 0;
  const password = document.getElementById('user-password').value;
  
  const userData = {
    nama: name,
    email,
    role,
    saldo,
    updatedAt: new Date()
  };
  
  if (userId) {
    // Update existing user
    db.collection('users').doc(userId).update(userData)
      .then(() => {
        showNotification('User berhasil diperbarui', 'success');
        loadUserList();
        closeUserModal();
      })
      .catch(error => {
        showNotification(`Gagal memperbarui user: ${error.message}`, 'error');
      });
  } else {
    // Create new user
    auth.createUserWithEmailAndPassword(email, password || 'defaultPassword')
      .then((userCredential) => {
        const newUser = userCredential.user;
        userData.createdAt = new Date();
        
        db.collection('users').doc(newUser.uid).set(userData)
          .then(() => {
            showNotification('User baru berhasil dibuat', 'success');
            loadUserList();
            closeUserModal();
          });
      })
      .catch(error => {
        showNotification(`Gagal membuat user: ${error.message}`, 'error');
      });
  }
}

// Hapus user
function deleteUser(userId, userName) {
  if (confirm(`Apakah Anda yakin ingin menghapus user ${userName || 'ini'}?`)) {
    db.collection('users').doc(userId).delete()
      .then(() => {
        showNotification('User berhasil dihapus', 'success');
        loadUserList();
      })
      .catch(error => {
        showNotification(`Gagal menghapus user: ${error.message}`, 'error');
      });
  }
}

// Tutup modal user
function closeUserModal() {
  document.getElementById('user-modal').style.display = 'none';
}

// Load semua transaksi
function loadAllTransactions() {
  const transactionList = document.getElementById('transaction-list');
  transactionList.innerHTML = '<tr><td colspan="7">Memuat data transaksi...</td></tr>';
  
  db.collection('transactions')
    .orderBy('tanggal', 'desc')
    .onSnapshot(snapshot => {
      if (snapshot.empty) {
        transactionList.innerHTML = '<tr><td colspan="7">Tidak ada transaksi</td></tr>';
        return;
      }
      
      transactionList.innerHTML = '';
      snapshot.forEach(doc => {
        const trans = doc.data();
        const date = trans.tanggal.toDate();
        
        const row = document.createElement('tr');
        row.innerHTML = `
          <td>${formatDate(date)}</td>
          <td>${getUserName(trans.userId)}</td>
          <td><span class="transaction-type ${trans.jenis}">${trans.jenis}</span></td>
          <td>${formatRupiah(trans.nominal)}</td>
          <td>${trans.keterangan || '-'}</td>
          <td><span class="status-badge completed">Selesai</span></td>
          <td>
            <button class="btn-edit-trans" data-id="${doc.id}">✏️</button>
            <button class="btn-delete-trans" data-id="${doc.id}">🗑️</button>
          </td>
        `;
        
        transactionList.appendChild(row);
      });
    });
}

// Dapatkan nama user berdasarkan ID
async function getUserName(userId) {
  const userDoc = await db.collection('users').doc(userId).get();
  return userDoc.exists ? userDoc.data().nama : 'Unknown';
}

// Load semua agenda
function loadAllAgendas() {
  const agendaList = document.getElementById('agenda-list');
  agendaList.innerHTML = '<tr><td colspan="6">Memuat data agenda...</td></tr>';
  
  db.collection('agenda')
    .orderBy('tanggal', 'desc')
    .onSnapshot(snapshot => {
      if (snapshot.empty) {
        agendaList.innerHTML = '<tr><td colspan="6">Tidak ada agenda</td></tr>';
        return;
      }
      
      agendaList.innerHTML = '';
      snapshot.forEach(doc => {
        const agenda = doc.data();
        const date = agenda.tanggal.toDate();
        
        const row = document.createElement('tr');
        row.innerHTML = `
          <td>${agenda.judul}</td>
          <td>${formatDate(date)}</td>
          <td>${agenda.lokasi || '-'}</td>
          <td><span class="agenda-category">${agenda.kategori}</span></td>
          <td><span class="status-badge ${date > new Date() ? 'upcoming' : 'completed'}">
              ${date > new Date() ? 'Akan Datang' : 'Selesai'}
            </span>
          </td>
          <td>
            <button class="btn-edit-agenda" data-id="${doc.id}">✏️</button>
            <button class="btn-delete-agenda" data-id="${doc.id}">🗑️</button>
          </td>
        `;
        
        agendaList.appendChild(row);
      });
    });
}

// Load semua postingan sosial
function loadAllSocialPosts() {
  const socialList = document.getElementById('social-list');
  socialList.innerHTML = '<tr><td colspan="6">Memuat data postingan...</td></tr>';
  
  db.collection('posts')
    .orderBy('timestamp', 'desc')
    .onSnapshot(snapshot => {
      if (snapshot.empty) {
        socialList.innerHTML = '<tr><td colspan="6">Tidak ada postingan</td></tr>';
        return;
      }
      
      socialList.innerHTML = '';
      snapshot.forEach(doc => {
        const post = doc.data();
        const date = post.timestamp.toDate();
        
        const row = document.createElement('tr');
        row.innerHTML = `
          <td>${post.userName}</td>
          <td class="truncate">${post.content.substring(0, 50)}${post.content.length > 50 ? '...' : ''}</td>
          <td>${formatDate(date)}</td>
          <td>${post.likes?.length || 0}</td>
          <td>${post.comments?.length || 0}</td>
          <td>
            <button class="btn-edit-post" data-id="${doc.id}">✏️</button>
            <button class="btn-delete-post" data-id="${doc.id}">🗑️</button>
          </td>
        `;
        
        socialList.appendChild(row);
      });
    });
}

// Setup pengaturan sistem
function setupSystemSettings() {
  document.getElementById('general-settings').addEventListener('submit', (e) => {
    e.preventDefault();
    
    const settings = {
      systemName: document.getElementById('system-name').value,
      currencySymbol: document.getElementById('currency-symbol').value,
      defaultSaldo: parseFloat(document.getElementById('default-saldo').value) || 0,
      adminEmail: document.getElementById('admin-email').value
    };
    
    // Simpan ke Firestore
    db.collection('system_settings').doc('main').set(settings, { merge: true })
      .then(() => {
        showNotification('Pengaturan berhasil disimpan', 'success');
      })
      .catch(error => {
        showNotification(`Gagal menyimpan pengaturan: ${error.message}`, 'error');
      });
  });
  
  // Load pengaturan yang ada
  db.collection('system_settings').doc('main').get()
    .then(doc => {
      if (doc.exists) {
        const settings = doc.data();
        document.getElementById('system-name').value = settings.systemName || 'QC Wallet';
        document.getElementById('currency-symbol').value = settings.currencySymbol || 'Rp';
        document.getElementById('default-saldo').value = settings.defaultSaldo || 100000;
        document.getElementById('admin-email').value = settings.adminEmail || 'admin@example.com';
      }
    });
}

// CSS tambahan untuk admin panel
const adminCSS = `
  /* Admin Panel Styles */
  .admin-menu {
    display: flex;
    gap: 10px;
    margin: 2rem 0;
    overflow-x: auto;
    padding-bottom: 10px;
  }
  
  .admin-menu-btn {
    padding: 12px 20px;
    border-radius: 12px;
    background: rgba(30, 30, 30, 0.5);
    border: 1px solid rgba(255, 255, 255, 0.1);
    color: var(--solana-text);
    cursor: pointer;
    white-space: nowrap;
    transition: all 0.3s ease;
  }
  
  .admin-menu-btn:hover {
    background: rgba(50, 50, 50, 0.7);
  }
  
  .admin-menu-btn.active {
    background: var(--gradient-primary);
    color: #000;
    font-weight: 600;
    border: none;
  }
  
  .admin-section {
    display: none;
  }
  
  .admin-section.active {
    display: block;
    animation: fadeIn 0.5s ease;
  }
  
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }
  
  .admin-table-container {
    overflow-x: auto;
    margin-top: 1rem;
  }
  
  .admin-table {
    width: 100%;
    border-collapse: collapse;
  }
  
  .admin-table th {
    background: rgba(30, 30, 30, 0.7);
    padding: 15px;
    text-align: left;
    font-weight: 600;
    border-bottom: 2px solid var(--solana-primary);
  }
  
  .admin-table td {
    padding: 12px 15px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  }
  
  .admin-table tr:hover {
    background: rgba(40, 40, 40, 0.3);
  }
  
  .status-badge {
    display: inline-block;
    padding: 5px 12px;
    border-radius: 20px;
    font-size: 0.85rem;
    font-weight: 500;
  }
  
  .status-badge.active {
    background: rgba(0, 255, 163, 0.1);
    color: var(--solana-primary);
  }
  
  .status-badge.completed {
    background: rgba(153, 69, 255, 0.1);
    color: var(--solana-secondary);
  }
  
  .status-badge.upcoming {
    background: rgba(20, 241, 149, 0.1);
    color: var(--solana-accent);
  }
  
  .role-badge {
    display: inline-block;
    padding: 5px 12px;
    border-radius: 20px;
    font-size: 0.85rem;
    font-weight: 500;
  }
  
  .role-badge.user {
    background: rgba(3, 225, 255, 0.1);
    color: var(--solana-blue);
  }
  
  .role-badge.admin {
    background: rgba(0, 255, 163, 0.1);
    color: var(--solana-primary);
  }
  
  .role-badge.auditor {
    background: rgba(173, 31, 255, 0.1);
    color: var(--solana-purple);
  }
  
  .transaction-type {
    display: inline-block;
    padding: 5px 12px;
    border-radius: 20px;
    font-size: 0.85rem;
    font-weight: 500;
  }
  
  .transaction-type.pemasukan {
    background: rgba(0, 255, 163, 0.1);
    color: var(--solana-primary);
  }
  
  .transaction-type.pengeluaran {
    background: rgba(255, 77, 77, 0.1);
    color: var(--solana-danger);
  }
  
  .transaction-type.transfer {
    background: rgba(3, 225, 255, 0.1);
    color: var(--solana-blue);
  }
  
  .admin-modal {
    display: none;
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.7);
    z-index: 1000;
    align-items: center;
    justify-content: center;
  }
  
  .modal-content {
    background: var(--solana-card);
    border-radius: 20px;
    width: 100%;
    max-width: 600px;
    max-height: 90vh;
    overflow-y: auto;
    box-shadow: 0 10px 50px rgba(0, 0, 0, 0.5);
  }
  
  .modal-header {
    padding: 20px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  
  .modal-close {
    background: none;
    border: none;
    color: var(--solana-text);
    font-size: 1.8rem;
    cursor: pointer;
  }
  
  .modal-body {
    padding: 20px;
  }
  
  .truncate {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 250px;
  }
`;

// Tambahkan CSS ke dokumen
const style = document.createElement('style');
style.textContent = adminCSS;
document.head.appendChild(style);