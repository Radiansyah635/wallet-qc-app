// js/firebaseConfig.js

// Konfigurasi Firebase Anda
// GANTI DENGAN KODE KONFIGURASI PROYEK FIREBASE ANDA SENDIRI!
const firebaseConfig = {
    apiKey: "YOUR_API_KEY", // GANTI INI
    authDomain: "YOUR_AUTH_DOMAIN", // GANTI INI
    projectId: "YOUR_PROJECT_ID", // GANTI INI
    storageBucket: "YOUR_STORAGE_BUCKET", // GANTI INI
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID", // GANTI INI
    appId: "YOUR_APP_ID" // GANTI INI
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
