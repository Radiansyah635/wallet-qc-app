import { db } from './firebase-config.js';
import Chart from 'chart.js/auto';

export async function renderGrafikKas() {
  const ctx = document.getElementById('grafik-kas');
  if (!ctx) return;
  
  // Ambil semua transaksi
  const snapshot = await db.collection('transactions').get();
  
  // Hitung total pemasukan dan pengeluaran
  let pemasukan = 0;
  let pengeluaran = 0;
  
  snapshot.forEach(doc => {
    const trans = doc.data();
    if (trans.jenis === 'pemasukan') {
      pemasukan += trans.nominal;
    } else if (trans.jenis === 'pengeluaran' || trans.jenis === 'transfer') {
      pengeluaran += trans.nominal;
    }
  });
  
  // Buat grafik
  new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['Pemasukan', 'Pengeluaran'],
      datasets: [{
        data: [pemasukan, pengeluaran],
        backgroundColor: [
          'rgba(0, 255, 163, 0.8)',
          'rgba(255, 77, 77, 0.8)'
        ],
        borderColor: [
          'rgba(0, 255, 163, 1)',
          'rgba(255, 77, 77, 1)'
        ],
        borderWidth: 2
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: 'top',
          labels: {
            color: '#ffffff',
            font: {
              size: 14
            }
          }
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              const label = context.label || '';
              const value = context.raw || 0;
              return `${label}: Rp${value.toLocaleString('id-ID')}`;
            }
          }
        }
      }
    }
  });
}

// Grafik perkembangan saldo 30 hari terakhir
export async function renderSaldoHistory() {
  const ctx = document.getElementById('grafik-saldo-history');
  if (!ctx) return;
  
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(endDate.getDate() - 30);
  
  const transactions = await db.collection('transactions')
    .where('tanggal', '>=', startDate)
    .where('tanggal', '<=', endDate)
    .orderBy('tanggal')
    .get();
  
  // Siapkan data per hari
  const dailyData = {};
  const date = new Date(startDate);
  
  while (date <= endDate) {
    const dateStr = date.toISOString().split('T')[0];
    dailyData[dateStr] = 0;
    date.setDate(date.getDate() + 1);
  }
  
  // Proses transaksi
  transactions.forEach(doc => {
    const trans = doc.data();
    const transDate = trans.tanggal.toDate().toISOString().split('T')[0];
    
    if (dailyData[transDate] === undefined) return;
    
    if (trans.jenis === 'pemasukan') {
      dailyData[transDate] += trans.nominal;
    } else {
      dailyData[transDate] -= trans.nominal;
    }
  });
  
  // Buat data untuk chart
  const labels = Object.keys(dailyData);
  const data = Object.values(dailyData);
  
  // Akumulasi saldo
  let cumulative = 0;
  const cumulativeData = data.map(value => {
    cumulative += value;
    return cumulative;
  });
  
  new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [{
        label: 'Saldo QC',
        data: cumulativeData,
        borderColor: 'rgba(0, 255, 163, 1)',
        backgroundColor: 'rgba(0, 255, 163, 0.1)',
        tension: 0.3,
        fill: true
      }]
    },
    options: {
      responsive: true,
      scales: {
        y: {
          beginAtZero: false,
          ticks: {
            callback: function(value) {
              return 'Rp' + value.toLocaleString('id-ID');
            }
          }
        },
        x: {
          ticks: {
            maxRotation: 0,
            autoSkip: true,
            maxTicksLimit: 10
          }
        }
      }
    }
  });
}