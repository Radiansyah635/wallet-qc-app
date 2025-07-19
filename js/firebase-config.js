// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyA...",
  authDomain: "qc-wallet-app.firebaseapp.com",
  projectId: "qc-wallet-app",
  storageBucket: "qc-wallet-app.appspot.com",
  messagingSenderId: "123...",
  appId: "1:123...:web:abc..."
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();
const storage = firebase.storage();

// Export modul
export { db, auth, storage };