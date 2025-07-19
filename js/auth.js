// ✅ Impor fungsi utilitas yang diperlukan
import { showNotification, resolvePath } from './utils.js';

export const loginUser = async (email, password) => {
  try {
    const userCredential = await firebase.auth().signInWithEmailAndPassword(email, password);
    showNotification('Login berhasil!', 'success');
    return userCredential;
  } catch (error) {
    let message = 'Terjadi kesalahan saat login';
    
    // ✅ Penanganan error spesifik
    switch (error.code) {
      case 'auth/user-not-found':
        message = 'Email tidak terdaftar';
        break;
      case 'auth/wrong-password':
        message = 'Password salah';
        break;
      case 'auth/too-many-requests':
        message = 'Terlalu banyak percobaan. Coba lagi nanti';
        break;
    }
    
    showNotification(message, 'error');
    throw error;
  }
};

export const registerUser = async (email, password, name) => {
  try {
    const userCredential = await firebase.auth().createUserWithEmailAndPassword(email, password);
    
    // ✅ Simpan data tambahan user di Firestore
    await firebase.firestore().collection('users').doc(userCredential.user.uid).set({
      email,
      nama: name,
      saldo: 0,
      role: "user",
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      lastLogin: null,
      profileImage: resolvePath('assets/default-avatar.png') // ✅ Gunakan resolvePath
    });
    
    showNotification('Pendaftaran berhasil!', 'success');
    return userCredential;
  } catch (error) {
    let message = 'Terjadi kesalahan saat pendaftaran';
    
    // ✅ Penanganan error spesifik
    switch (error.code) {
      case 'auth/email-already-in-use':
        message = 'Email sudah terdaftar';
        break;
      case 'auth/weak-password':
        message = 'Password terlalu lemah (minimal 6 karakter)';
        break;
      case 'auth/invalid-email':
        message = 'Format email tidak valid';
        break;
    }
    
    showNotification(message, 'error');
    throw error;
  }
};

export const logoutUser = async () => {
  try {
    // ✅ Update last login sebelum logout
    const user = firebase.auth().currentUser;
    if (user) {
      await firebase.firestore().collection('users').doc(user.uid).update({
        lastLogin: firebase.firestore.FieldValue.serverTimestamp()
      });
    }
    
    await firebase.auth().signOut();
    showNotification('Anda berhasil logout', 'success');
  } catch (error) {
    showNotification('Gagal logout: ' + error.message, 'error');
    throw error;
  }
};

// ✅ Fungsi tambahan untuk reset password
export const resetPassword = async (email) => {
  try {
    await firebase.auth().sendPasswordResetEmail(email);
    showNotification('Instruksi reset password telah dikirim ke email Anda', 'success');
  } catch (error) {
    let message = 'Gagal mengirim instruksi reset password';
    
    if (error.code === 'auth/user-not-found') {
      message = 'Email tidak terdaftar';
    }
    
    showNotification(message, 'error');
    throw error;
  }
};

// ✅ Fungsi untuk update profil
export const updateProfile = async (name, photoURL) => {
  try {
    const user = firebase.auth().currentUser;
    
    // Update di Firebase Auth
    await user.updateProfile({
      displayName: name,
      photoURL: photoURL
    });
    
    // Update di Firestore
    await firebase.firestore().collection('users').doc(user.uid).update({
      nama: name,
      profileImage: photoURL
    });
    
    showNotification('Profil berhasil diperbarui', 'success');
    return user;
  } catch (error) {
    showNotification('Gagal memperbarui profil: ' + error.message, 'error');
    throw error;
  }
};
