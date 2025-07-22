// firebase-config.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";
import { 
  getAuth, 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";
import { 
  getFirestore,
  doc,
  getDoc,
  setDoc,
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

// Konfigurasi Firebase Anda
const firebaseConfig = {
  apiKey: "AIzaSyD0RL0zvv4DL9EBax3XouugVZpkHdzyVNQ",
  authDomain: "wallet-qc-local-storage.firebaseapp.com",
  projectId: "wallet-qc-local-storage",
  storageBucket: "wallet-qc-local-storage.appspot.com",
  messagingSenderId: "443546801664",
  appId: "1:443546801664:web:d520fd8d2f311edd20aae5"
};

// Inisialisasi Firebase
const app = initializeApp(firebaseConfig);

// Inisialisasi layanan Firebase
const auth = getAuth(app);
const db = getFirestore(app);

// Fungsi untuk mendaftar user baru
async function registerUser(email, password, username) {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Simpan data tambahan user ke Firestore
    await setDoc(doc(db, "users", user.uid), {
      email: email,
      username: username,
      role: "user", // Default role
      createdAt: serverTimestamp(),
      photoURL: "" // Default empty photo
    });
    
    return { success: true, user: user };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Fungsi untuk login user
async function loginUser(email, password) {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return { success: true, user: userCredential.user };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Fungsi untuk logout
async function logoutUser() {
  try {
    await signOut(auth);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Fungsi untuk memeriksa status auth
function checkAuthState(callback) {
  return onAuthStateChanged(auth, (user) => {
    callback(user);
  });
}
// Fungsi untuk mendapatkan role user
async function getUserRole(uid) {
  try {
    const userDoc = await getDoc(doc(db, "users", uid));
    if (userDoc.exists()) {
      return userDoc.data().role || 'user'; // Default ke 'user' jika role tidak ada
    }
    return 'user';
  } catch (error) {
    console.error("Error getting user role:", error);
    return 'user';
  }
}

// Tambahkan ke export
export {
  // ... ekspor lainnya
  getUserRole
};

// Fungsi untuk mendapatkan data user dari Firestore
async function getUserData(uid) {
  try {
    const userDoc = await getDoc(doc(db, "users", uid));
    if (userDoc.exists()) {
      return { success: true, data: userDoc.data() };
    } else {
      return { success: false, error: "User data not found" };
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Fungsi untuk menambahkan agenda baru
async function addAgenda(agendaData) {
  try {
    const docRef = await addDoc(collection(db, "agendas"), {
      ...agendaData,
      createdAt: serverTimestamp(),
      createdBy: auth.currentUser.uid
    });
    return { success: true, id: docRef.id };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Fungsi untuk mendapatkan daftar agenda
function getAgendas(callback) {
  const q = query(collection(db, "agendas"), orderBy("createdAt", "desc"));
  return onSnapshot(q, (snapshot) => {
    const agendas = [];
    snapshot.forEach((doc) => {
      agendas.push({ id: doc.id, ...doc.data() });
    });
    callback(agendas);
  });
}

// Fungsi untuk update profil user
async function updateUserProfile(uid, profileData) {
  try {
    await setDoc(doc(db, "users", uid), profileData, { merge: true });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Export semua fungsi dan layanan yang dibutuhkan
export { 
  app,
  auth,
  db,
  registerUser,
  loginUser,
  logoutUser,
  checkAuthState,
  getUserData,
  addAgenda,
  getAgendas,
  updateUserProfile,
  serverTimestamp
};
