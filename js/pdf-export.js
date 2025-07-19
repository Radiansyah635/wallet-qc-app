// HAPUS IMPOR INI
// import { db } from './firebase-config.js'; 

// GUNAKAN jsPDF DARI GLOBAL
const { jsPDF } = window.jspdf;

import { formatDate, formatRupiah } from './utils.js';

export async function exportTransactionsPDF(userId, startDate = null, endDate = null) {
  try {
    // Akses firestore dari global firebase
    const db = firebase.firestore();
    
    let query = db.collection('transactions')
      .where('userId', '==', userId)
      .orderBy('tanggal', 'desc');
    
    if (startDate && endDate) {
      query = query.where('tanggal', '>=', startDate)
                  .where('tanggal', '<=', endDate);
    }
    
    const snapshot = await query.get();
    
    // Siapkan data untuk PDF
    const data = [];
    let totalPemasukan = 0;
    let totalPengeluaran = 0;
    
    snapshot.forEach(doc => {
      const trans = doc.data();
      const nominal = trans.nominal || 0;
      
      if (trans.jenis === 'pemasukan') {
        totalPemasukan += nominal;
      } else {
        totalPengeluaran += nominal;
      }
      
      data.push([
        formatDate(trans.tanggal.toDate()),
        trans.jenis,
        formatRupiah(nominal),
        trans.keterangan || '-',
        trans.penerima || trans.pengirim || '-'
      ]);
    });
    
    // Buat PDF
    const doc = new jsPDF();
    
    // Header dengan tema Solana
    doc.setFontSize(18);
    doc.setTextColor(0, 255, 163); // Warna hijau Solana
    doc.text('LAPORAN TRANSAKSI QC WALLET', 105, 15, null, null, 'center');
    
    // Informasi pengguna dan periode
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.text(`User ID: ${userId}`, 14, 25);
    
    if (startDate && endDate) {
      doc.text(`Periode: ${formatDate(startDate)} - ${formatDate(endDate)}`, 14, 30);
    } else {
      doc.text('Periode: Semua Data', 14, 30);
    }
    
    // Ringkasan transaksi
    doc.setFontSize(11);
    doc.text(`Total Pemasukan: ${formatRupiah(totalPemasukan)}`, 14, 40);
    doc.text(`Total Pengeluaran: ${formatRupiah(totalPengeluaran)}`, 14, 45);
    doc.text(`Saldo Akhir: ${formatRupiah(totalPemasukan - totalPengeluaran)}`, 14, 50);
    
    // Tabel transaksi
    doc.autoTable({
      startY: 55,
      head: [['Tanggal', 'Jenis', 'Nominal', 'Keterangan', 'Pihak Terkait']],
      body: data,
      theme: 'grid',
      headStyles: {
        fillColor: [10, 10, 30], // Warna gelap
        textColor: [0, 255, 163], // Hijau Solana
        fontStyle: 'bold'
      },
      styles: {
        fontSize: 9,
        cellPadding: 3
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245]
      }
    });
    
    // Footer
    const pageCount = doc.internal.getNumberOfPages();
    const dateStr = new Date().toLocaleDateString('id-ID');
    
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(100);
      doc.text(`Dibuat pada: ${dateStr} - Halaman ${i} dari ${pageCount}`, 
        105, doc.internal.pageSize.height - 10, null, null, 'center');
    }
    
    // Simpan PDF
    doc.save(`transaksi-${userId}-${dateStr.replace(/\//g, '-')}.pdf`);
    return true;
    
  } catch (error) {
    console.error("Export PDF error:", error);
    throw new Error("Gagal membuat laporan PDF: " + error.message);
  }
}