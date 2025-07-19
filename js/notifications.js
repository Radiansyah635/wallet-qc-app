import { db, auth } from './firebase-config.js';
import { showNotification } from './utils.js';

export function initNotifications() {
  const user = auth.currentUser;
  if (!user) return;
  
  // Listener untuk transfer masuk
  db.collection('transactions')
    .where('userId', '==', user.uid)
    .where('jenis', '==', 'pemasukan')
    .where('pengirim', '!=', null)
    .onSnapshot(snapshot => {
      snapshot.docChanges().forEach(change => {
        if (change.type === 'added') {
          const trans = change.doc.data();
          showNotification(
            `Anda menerima transfer Rp${formatRupiah(trans.nominal)} dari ${await getUsername(trans.pengirim)}`,
            'success'
          );
        }
      });
    });
  
  // Listener untuk agenda mendatang
  db.collection('agenda')
    .where('tanggal', '>=', new Date())
    .onSnapshot(snapshot => {
      snapshot.docChanges().forEach(change => {
        if (change.type === 'added') {
          const agenda = change.doc.data();
          const hoursLeft = Math.floor((agenda.tanggal.toDate() - new Date()) / 3600000);
          
          if (hoursLeft < 24) {
            showNotification(
              `Agenda "${agenda.judul}" akan dimulai dalam ${hoursLeft} jam`,
              'info'
            );
          }
        }
      });
    });
}

async function getUsername(userId) {
  const userDoc = await db.collection('users').doc(userId).get();
  return userDoc.exists ? userDoc.data().nama : 'Pengguna';
}