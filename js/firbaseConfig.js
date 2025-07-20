// js/firebaseConfig.js

// Konfigurasi Firebase Anda
// GANTI DENGAN KODE KONFIGURASI PROYEK FIREBASE ANDA SENDIRI!
// Firebase configuration
        const firebaseConfig = {
          apiKey: "AIzaSyD0RL0zvv4DL9EBax3XouugVZpkHdzyVNQ",
          authDomain: "wallet-qc-local-storage.firebaseapp.com",
          projectId: "wallet-qc-local-storage",
          storageBucket: "wallet-qc-local-storage.appspot.com",
          messagingSenderId: "443546801664",
          appId: "1:443546801664:web:6d0342e1b8261dd920aae5",
};

// Inisialisasi Firebase
firebase.initializeApp(firebaseConfig);

// Inisialisasi layanan Firebase
const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();

// Ekspor instance Firebase untuk digunakan di file lain (jika menggunakan modul ES6)
// Untuk saat ini, karena kita menggunakan script biasa di HTML, variabel ini akan global.
// Namun, jika Anda berencana menggunakan import/export di masa depan,
// Anda bisa menambahkan baris ini:
// export { auth, db, storage };
