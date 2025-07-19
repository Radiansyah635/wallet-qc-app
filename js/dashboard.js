import { db, auth } from './firebase-config.js';
import { formatRupiah, renderGrafikKas } from './utils.js';

export function initDashboard() {
  // Load user data
  const user = auth.currentUser;
  if (user) {
    document.querySelector('.user-name').textContent = user.displayName || 'User';
    
    // Load user role
    db.collection('users').doc(user.uid).get()
      .then(doc => {
        if (doc.exists) {
          const userData = doc.data();
          document.querySelector('.user-role').textContent = userData.role === 'admin' ? 'Admin' : 'User';
        }
      });
  }
  
  // Load balance data
  loadBalanceData();
  
  // Render chart
  renderGrafikKas();
  
  // Load transactions
  loadRecentTransactions();
  
  // Load upcoming agendas
  loadUpcomingAgendas();
}

function loadBalanceData() {
  const user = auth.currentUser;
  if (!user) return;
  
  db.collection('users').doc(user.uid).onSnapshot(doc => {
    if (doc.exists) {
      const userData = doc.data();
      document.getElementById('total-saldo').textContent = formatRupiah(userData.saldo || 0);
    }
  });
}

function loadRecentTransactions() {
  const user = auth.currentUser;
  if (!user) return;
  
  const transactionsList = document.querySelector('.transaction-list');
  transactionsList.innerHTML = '<p>Memuat transaksi...</p>';
  
  db.collection('transactions')
    .where('userId', '==', user.uid)
    .orderBy('tanggal', 'desc')
    .limit(5)
    .onSnapshot(snapshot => {
      if (snapshot.empty) {
        transactionsList.innerHTML = '<p>Belum ada transaksi</p>';
        return;
      }
      
      transactionsList.innerHTML = '';
      snapshot.forEach(doc => {
        const trans = doc.data();
        const transactionItem = document.createElement('div');
        transactionItem.className = 'transaction-item';
        
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
        
        transactionItem.innerHTML = `
          <div class="transaction-icon">${icon}</div>
          <div class="transaction-details">
            <div class="transaction-title">${trans.keterangan || 'Transaksi'}</div>
            <div class="transaction-date">${new Date(trans.tanggal).toLocaleString('id-ID')}</div>
          </div>
          <div class="transaction-amount ${typeClass}">
            ${trans.jenis === 'pemasukan' ? '+' : '-'}${formatRupiah(trans.nominal)}
          </div>
        `;
        
        transactionsList.appendChild(transactionItem);
      });
    });
}

function loadUpcomingAgendas() {
  const agendaContainer = document.querySelector('.agenda-grid');
  if (!agendaContainer) return;
  
  agendaContainer.innerHTML = '<p>Memuat agenda...</p>';
  
  const now = new Date();
  const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  
  db.collection('agenda')
    .where('tanggal', '>=', now)
    .where('tanggal', '<=', nextWeek)
    .orderBy('tanggal', 'asc')
    .limit(3)
    .onSnapshot(snapshot => {
      if (snapshot.empty) {
        agendaContainer.innerHTML = '<p>Tidak ada agenda mendatang</p>';
        return;
      }
      
      agendaContainer.innerHTML = '';
      snapshot.forEach(doc => {
        const agenda = doc.data();
        const date = agenda.tanggal.toDate();
        const agendaCard = document.createElement('div');
        agendaCard.className = 'card agenda-card';
        
        agendaCard.innerHTML = `
          <div class="agenda-badge">${agenda.kategori || 'Umum'}</div>
          <div class="agenda-date">${date.getDate()} ${date.toLocaleString('id-ID', { month: 'short' }).toUpperCase()}</div>
          <div class="agenda-content">
            <h3 class="agenda-title">${agenda.judul}</h3>
            <p>${agenda.deskripsi.substring(0, 100)}</p>
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
        
        agendaContainer.appendChild(agendaCard);
      });
    });
}