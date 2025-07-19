import { db, auth } from './firebase-config.js';
import { formatRupiah, renderGrafikKas, resolvePath, showNotification } from './utils.js';

// Cache DOM elements
const domCache = {
  userName: document.querySelector('.user-name'),
  userRole: document.querySelector('.user-role'),
  totalSaldo: document.getElementById('total-saldo'),
  transactionsList: document.querySelector('.transaction-list'),
  agendaContainer: document.querySelector('.agenda-grid'),
  statsContainer: document.querySelector('.stats-grid')
};

// Unsubscribe functions
let userUnsubscribe = null;
let balanceUnsubscribe = null;
let transactionsUnsubscribe = null;
let agendasUnsubscribe = null;

export async function initDashboard() {
  try {
    const user = auth.currentUser;
    if (!user) {
      showNotification('Anda belum login', 'error');
      return;
    }

    // Load user data
    await loadUserData(user);
    
    // Load stats
    await loadStats();
    
    // Render chart
    renderGrafikKas();
    
    // Load transactions
    loadRecentTransactions();
    
    // Load upcoming agendas
    loadUpcomingAgendas();
    
    // Set up event listeners
    setupEventListeners();
  } catch (error) {
    console.error('Dashboard initialization error:', error);
    showNotification('Gagal memuat dashboard', 'error');
  }
}

async function loadUserData(user) {
  try {
    // Set initial user info
    domCache.userName.textContent = user.displayName || 'User';
    
    // Load user document
    const userDoc = await db.collection('users').doc(user.uid).get();
    
    if (userDoc.exists) {
      const userData = userDoc.data();
      domCache.userRole.textContent = userData.role === 'admin' ? 'Admin' : 'User';
      
      // Set balance
      domCache.totalSaldo.textContent = formatRupiah(userData.saldo || 0);
      
      // Set up real-time balance updates
      balanceUnsubscribe = db.collection('users').doc(user.uid)
        .onSnapshot(doc => {
          if (doc.exists) {
            const updatedData = doc.data();
            domCache.totalSaldo.textContent = formatRupiah(updatedData.saldo || 0);
          }
        });
    } else {
      showNotification('Profil pengguna tidak ditemukan', 'error');
    }
  } catch (error) {
    console.error('Error loading user data:', error);
    showNotification('Gagal memuat data pengguna', 'error');
  }
}

async function loadStats() {
  try {
    const user = auth.currentUser;
    if (!user) return;
    
    // Load stats data
    const statsData = await Promise.all([
      // Pemasukan
      db.collection('transactions')
        .where('userId', '==', user.uid)
        .where('jenis', '==', 'pemasukan')
        .get(),
      
      // Pengeluaran
      db.collection('transactions')
        .where('userId', '==', user.uid)
        .where('jenis', '==', 'pengeluaran')
        .get(),
      
      // Agenda
      db.collection('agenda')
        .where('tanggal', '>=', new Date())
        .get(),
      
      // Transaksi
      db.collection('transactions')
        .where('userId', '==', user.uid)
        .get()
    ]);
    
    // Process stats
    const pemasukan = statsData[0].docs.reduce((sum, doc) => sum + doc.data().nominal, 0);
    const pengeluaran = statsData[1].docs.reduce((sum, doc) => sum + doc.data().nominal, 0);
    const agendaCount = statsData[2].size;
    const transaksiCount = statsData[3].size;
    
    // Render stats
    domCache.statsContainer.innerHTML = `
      <div class="card">
        <div class="card-header">
          <h3>Pemasukan</h3>
          <div class="card-icon">↑</div>
        </div>
        <div class="text-success" style="font-size: 1.8rem; font-weight: 700;">${formatRupiah(pemasukan)}</div>
        <p style="margin-bottom: 0;">Total pendapatan</p>
      </div>
      
      <div class="card">
        <div class="card-header">
          <h3>Pengeluaran</h3>
          <div class="card-icon">↓</div>
        </div>
        <div class="text-danger" style="font-size: 1.8rem; font-weight: 700;">${formatRupiah(pengeluaran)}</div>
        <p style="margin-bottom: 0;">Total pengeluaran</p>
      </div>
      
      <div class="card">
        <div class="card-header">
          <h3>Agenda</h3>
          <div class="card-icon">📅</div>
        </div>
        <div style="font-size: 1.8rem; font-weight: 700;">${agendaCount}</div>
        <p style="margin-bottom: 0;">Agenda mendatang</p>
      </div>
      
      <div class="card">
        <div class="card-header">
          <h3>Transaksi</h3>
          <div class="card-icon">↔</div>
        </div>
        <div style="font-size: 1.8rem; font-weight: 700;">${transaksiCount}</div>
        <p style="margin-bottom: 0;">Total transaksi</p>
      </div>
    `;
  } catch (error) {
    console.error('Error loading stats:', error);
    domCache.statsContainer.innerHTML = '<p>Gagal memuat statistik</p>';
  }
}

function loadRecentTransactions() {
  const user = auth.currentUser;
  if (!user) return;
  
  domCache.transactionsList.innerHTML = '<p>Memuat transaksi...</p>';
  
  // Set up real-time transactions listener
  transactionsUnsubscribe = db.collection('transactions')
    .where('userId', '==', user.uid)
    .orderBy('tanggal', 'desc')
    .limit(5)
    .onSnapshot(snapshot => {
      try {
        if (snapshot.empty) {
          domCache.transactionsList.innerHTML = '<p>Belum ada transaksi</p>';
          return;
        }
        
        domCache.transactionsList.innerHTML = '';
        snapshot.forEach(doc => {
          const trans = doc.data();
          const transactionItem = document.createElement('div');
          transactionItem.className = 'transaction-item';
          
          let icon = '↔';
          let typeClass = '';
          let sign = '';
          
          if (trans.jenis === 'pemasukan') {
            icon = '↑';
            typeClass = 'positive';
            sign = '+';
          } else if (trans.jenis === 'pengeluaran') {
            icon = '↓';
            typeClass = 'negative';
            sign = '-';
          } else if (trans.jenis === 'transfer') {
            icon = '→';
            typeClass = 'negative';
            sign = '-';
          }
          
          // Format date
          const transactionDate = trans.tanggal.toDate 
            ? trans.tanggal.toDate() 
            : new Date(trans.tanggal);
          
          transactionItem.innerHTML = `
            <div class="transaction-icon">${icon}</div>
            <div class="transaction-details">
              <div class="transaction-title">${trans.keterangan || 'Transaksi'}</div>
              <div class="transaction-date">${transactionDate.toLocaleString('id-ID')}</div>
            </div>
            <div class="transaction-amount ${typeClass}">
              ${sign}${formatRupiah(trans.nominal)}
            </div>
          `;
          
          // Add click event to view details
          transactionItem.addEventListener('click', () => {
            showTransactionDetails(doc.id);
          });
          
          domCache.transactionsList.appendChild(transactionItem);
        });
      } catch (error) {
        console.error('Error loading transactions:', error);
        domCache.transactionsList.innerHTML = '<p>Gagal memuat transaksi</p>';
      }
    }, error => {
      console.error('Transactions snapshot error:', error);
      showNotification('Gagal memuat transaksi', 'error');
    });
}

function loadUpcomingAgendas() {
  if (!domCache.agendaContainer) return;
  
  domCache.agendaContainer.innerHTML = '<p>Memuat agenda...</p>';
  
  const now = new Date();
  const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  
  // Set up real-time agendas listener
  agendasUnsubscribe = db.collection('agenda')
    .where('tanggal', '>=', now)
    .where('tanggal', '<=', nextWeek)
    .orderBy('tanggal', 'asc')
    .limit(3)
    .onSnapshot(snapshot => {
      try {
        if (snapshot.empty) {
          domCache.agendaContainer.innerHTML = '<p>Tidak ada agenda mendatang</p>';
          return;
        }
        
        domCache.agendaContainer.innerHTML = '';
        snapshot.forEach(doc => {
          const agenda = doc.data();
          const date = agenda.tanggal.toDate 
            ? agenda.tanggal.toDate() 
            : new Date(agenda.tanggal);
          
          const agendaCard = document.createElement('div');
          agendaCard.className = 'card agenda-card';
          
          // Safe description handling
          const description = agenda.deskripsi 
            ? agenda.deskripsi.substring(0, 100) + (agenda.deskripsi.length > 100 ? '...' : '')
            : 'Tidak ada deskripsi';
          
          agendaCard.innerHTML = `
            <div class="agenda-badge">${agenda.kategori || 'Umum'}</div>
            <div class="agenda-date">${date.getDate()} ${date.toLocaleString('id-ID', { month: 'short' }).toUpperCase()}</div>
            <div class="agenda-content">
              <h3 class="agenda-title">${agenda.judul || 'Agenda Tanpa Judul'}</h3>
              <p>${description}</p>
              <div class="agenda-meta">
                <div class="agenda-time">⏰ ${date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</div>
                <div class="agenda-location">📍 ${agenda.lokasi || 'Belum ditentukan'}</div>
              </div>
              ${agenda.lampiran ? `
              <div class="agenda-attachment">
                <i class="btn-icon">📎</i> ${agenda.lampiran.name}
              </div>
              ` : ''}
            </div>
          `;
          
          // Add click event to view details
          agendaCard.addEventListener('click', () => {
            showAgendaDetails(doc.id);
          });
          
          domCache.agendaContainer.appendChild(agendaCard);
        });
      } catch (error) {
        console.error('Error loading agendas:', error);
        domCache.agendaContainer.innerHTML = '<p>Gagal memuat agenda</p>';
      }
    }, error => {
      console.error('Agendas snapshot error:', error);
      showNotification('Gagal memuat agenda', 'error');
    });
}

function setupEventListeners() {
  // Transfer button
  const transferBtn = document.getElementById('transfer-btn');
  if (transferBtn) {
    transferBtn.addEventListener('click', () => {
      // Implement transfer functionality
      showNotification('Fitur transfer akan segera tersedia', 'info');
    });
  }
  
  // View all transactions
  const viewTransactions = document.getElementById('view-transactions');
  if (viewTransactions) {
    viewTransactions.addEventListener('click', () => {
      // Implement view all transactions
      showNotification('Daftar transaksi penuh akan segera tersedia', 'info');
    });
  }
  
  // View all agendas
  const viewAgendas = document.getElementById('view-agendas');
  if (viewAgendas) {
    viewAgendas.addEventListener('click', () => {
      // Implement view all agendas
      showNotification('Daftar agenda penuh akan segera tersedia', 'info');
    });
  }
}

function showTransactionDetails(transactionId) {
  // Implement transaction details view
  showNotification(`Detail transaksi: ${transactionId}`, 'info');
}

function showAgendaDetails(agendaId) {
  // Implement agenda details view
  showNotification(`Detail agenda: ${agendaId}`, 'info');
}

// Clean up when leaving the dashboard
export function cleanupDashboard() {
  if (balanceUnsubscribe) balanceUnsubscribe();
  if (transactionsUnsubscribe) transactionsUnsubscribe();
  if (agendasUnsubscribe) agendasUnsubscribe();
  
  // Reset DOM cache references
  Object.keys(domCache).forEach(key => {
    domCache[key] = null;
  });
}
