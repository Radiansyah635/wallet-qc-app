// js/login.js

// Firebase Imports
// Pastikan versi SDK ini cocok dengan yang Anda gunakan di register.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";
// getFirestore tidak diperlukan untuk proses login jika Anda hanya ingin autentikasi

// Konfigurasi Firebase Anda
const firebaseConfig = {
  apiKey: "AIzaSyD0RL0zvv4DL9EBax3XouugVZpkHdzyVNQ", // Ganti dengan API Key Anda
  authDomain: "wallet-qc-local-storage.firebaseapp.com", // Ganti dengan Auth Domain Anda
  projectId: "wallet-qc-local-storage", // Ganti dengan Project ID Anda
  storageBucket: "wallet-qc-local-storage.appspot.com",
  messagingSenderId: "443546801664",
  appId: "1:443546801664:web:d520fd8d2f311edd20aae5",
};

// Inisialisasi Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app); // Dapatkan instance Auth

// --- Fungsionalitas Tambahan dari Script HTML Sebelumnya ---

// Toggle password visibility
const togglePassword = document.getElementById('togglePassword');
const passwordInput = document.getElementById('password');

// Pastikan elemen ada sebelum menambahkan event listener
if (togglePassword && passwordInput) {
    togglePassword.addEventListener('click', function() {
        const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        passwordInput.setAttribute('type', type);
        this.innerHTML = type === 'password' ? '<i class="fas fa-eye"></i>' : '<i class="fas fa-eye-slash"></i>';
    });
}

// Show notification (direvisi agar sesuai dengan #message)
function showNotification(messageText, type = "success") {
    const messageElement = document.getElementById('message');
    if (messageElement) { // Pastikan elemen #message ada
        messageElement.textContent = messageText;
        messageElement.classList.remove('text-green-500', 'text-red-500'); // Hapus kelas sebelumnya
        if (type === "success") {
            messageElement.classList.add('text-green-500');
        } else if (type === "error") {
            messageElement.classList.add('text-red-500');
        }
    }
}

// Create background particles
function createParticles() {
    const particlesContainer = document.getElementById('particles');
    if (!particlesContainer) return; // Keluar jika container tidak ditemukan

    const particleCount = 20;
    
    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.classList.add('particle');
        
        const size = Math.random() * 50 + 10;
        const posX = Math.random() * 100;
        const posY = Math.random() * 100;
        const opacity = Math.random() * 0.1 + 0.05;
        
        particle.style.width = `${size}px`;
        particle.style.height = `${size}px`;
        particle.style.left = `${posX}%`;
        particle.style.top = `${posY}%`;
        particle.style.opacity = opacity;
        
        particlesContainer.appendChild(particle);
    }
}

// Initialize the page (panggil createParticles saat DOMContentLoaded)
document.addEventListener('DOMContentLoaded', function() {
  createParticles();
});


// --- Logic Form Submission Utama dengan Firebase Authentication ---
const loginForm = document.getElementById('loginForm');

// Pastikan elemen loginForm ada di HTML
if (loginForm) {
    loginForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value.trim();
        
        const submitBtn = loginForm.querySelector('button[type="submit"]');
        const originalText = submitBtn ? submitBtn.innerHTML : '';

        // Validasi sederhana
        if (!email || !password) {
            showNotification('Please fill in both fields', 'error');
            if (submitBtn) { submitBtn.innerHTML = originalText; submitBtn.disabled = false; }
            return;
        }

        // Tampilkan loading
        if (submitBtn) {
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Authenticating...';
            submitBtn.disabled = true;
        }

        try {
            // Melakukan login dengan Firebase Authentication
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            // const user = userCredential.user; // Anda bisa mengakses data user di sini jika diperlukan

            showNotification("Login successful! Redirecting...", "success");

            // Redirect ke halaman dashboard setelah 2 detik
            setTimeout(() => {
                window.location.href = 'dashboard.html'; // Ganti 'dashboard.html' dengan URL dashboard Anda
            }, 2000);

        } catch (error) {
            console.error("Error during login:", error);
            let errorMessage = error.message;
            // Menangani error spesifik dari Firebase Authentication
            if (error.code === 'auth/wrong-password') {
                errorMessage = 'Password salah.';
            } else if (error.code === 'auth/user-not-found') {
                errorMessage = 'Email tidak terdaftar.';
            } else if (error.code === 'auth/invalid-email') {
                errorMessage = 'Format email tidak valid.';
            } else if (error.code === 'auth/user-disabled') {
                errorMessage = 'Akun Anda telah dinonaktifkan.';
            }
            showNotification(errorMessage, "error");

        } finally {
            // Selalu kembalikan tombol ke keadaan semula
            if (submitBtn) {
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
            }
            // Kosongkan form setelah mencoba login (baik berhasil atau gagal)
            loginForm.reset();
        }
    });
                               }
