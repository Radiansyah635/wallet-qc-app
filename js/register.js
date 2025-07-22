// js/register.js

// Firebase Imports (pastikan versi SDK sama dengan yang Anda gunakan di console)
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";
import { getFirestore, doc, setDoc } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

// Konfigurasi Firebase Anda
const firebaseConfig = {
  apiKey: "AIzaSyD0RL0zvv4DL9EBax3XouugVZpkHdzyVNQ",
  authDomain: "wallet-qc-local-storage.firebaseapp.com",
  projectId: "wallet-qc-local-storage",
  storageBucket: "wallet-qc-local-storage.appspot.com",
  messagingSenderId: "443546801664",
  appId: "1:443546801664:web:d520fd8d2f311edd20aae5",
};

// Inisialisasi Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// --- Fungsionalitas dari Script Pertama, Dipindahkan ke Sini ---

// Toggle password visibility
const togglePassword = document.getElementById('togglePassword');
const passwordInput = document.getElementById('password');

const toggleConfirmPassword = document.getElementById('toggleConfirmPassword');
const confirmPasswordInput = document.getElementById('confirmPassword');

function togglePasswordVisibility(inputElement, toggleElement) {
  const type = inputElement.getAttribute('type') === 'password' ? 'text' : 'password';
  inputElement.setAttribute('type', type);
  toggleElement.innerHTML = type === 'password' ? '<i class="fas fa-eye"></i>' : '<i class="fas fa-eye-slash"></i>';
}

// Pastikan elemen togglePassword dan toggleConfirmPassword ada di HTML Anda
if (togglePassword && passwordInput) {
    togglePassword.addEventListener('click', () => togglePasswordVisibility(passwordInput, togglePassword));
}
if (toggleConfirmPassword && confirmPasswordInput) {
    toggleConfirmPassword.addEventListener('click', () => togglePasswordVisibility(confirmPasswordInput, toggleConfirmPassword));
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
        // Jika Anda ingin notifikasi menghilang setelah beberapa waktu
        // setTimeout(() => {
        //     messageElement.textContent = '';
        //     messageElement.classList.remove('text-green-500', 'text-red-500');
        // }, 5000);
    }
}

// Password strength meter
// Pastikan elemen passwordInput ada di HTML
if (passwordInput) {
    passwordInput.addEventListener('input', function() {
        const password = this.value;
        const meter = document.getElementById('strengthMeter');
        const text = document.getElementById('strengthText');
        
        if (!meter || !text) return; // Keluar jika elemen tidak ditemukan

        let strength = 0;
        let textValue = 'Weak';
        let width = '20%';
        let color = '#ef4444';
        
        if (password.length >= 8) strength++;
        if (password.match(/[a-z]+/)) strength++;
        if (password.match(/[A-Z]+/)) strength++;
        if (password.match(/[0-9]+/)) strength++;
        if (password.match(/[$@#&!]+/)) strength++;
        
        switch(strength) {
            case 0:
            case 1:
                textValue = 'Weak';
                width = '20%';
                color = '#ef4444';
                break;
            case 2:
                textValue = 'Fair';
                width = '40%';
                color = '#f59e0b';
                break;
            case 3:
                textValue = 'Good';
                width = '60%';
                color = '#84cc16';
                break;
            case 4:
                textValue = 'Strong';
                width = '80%';
                color = '#10b981';
                break;
            case 5:
                textValue = 'Very Strong';
                width = '100%';
                color = '#14F195';
                break;
        }
        
        meter.style.width = width;
        meter.style.background = color;
        text.textContent = `Password strength: ${textValue}`;
        text.style.color = color;
    });
}

// Email validation (fungsi ini sudah ada di script pertama, kita pindahkan)
function validateEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

// Create background particles (fungsi ini juga dari script pertama)
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


// --- Logic Form Submission Utama dengan Firebase ---
document.getElementById('registerForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const username = document.getElementById('username') ? document.getElementById('username').value.trim() : ''; // Handle jika username tidak ada
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value.trim();
    const confirmPassword = document.getElementById('confirmPassword') ? document.getElementById('confirmPassword').value.trim() : ''; // Handle jika confirmPassword tidak ada
    const terms = document.getElementById('terms') ? document.getElementById('terms').checked : false; // Handle jika terms tidak ada

    // Ambil tombol submit untuk efek loading
    const submitBtn = document.getElementById('registerForm').querySelector('button[type="submit"]');
    const originalText = submitBtn ? submitBtn.innerHTML : '';
    if (submitBtn) {
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating account...';
        submitBtn.disabled = true;
    }

    // Validasi yang sama dari script pertama
    if (!username || !email || !password || (document.getElementById('confirmPassword') && !confirmPassword)) {
        showNotification('Please fill in all fields', 'error');
        if (submitBtn) { submitBtn.innerHTML = originalText; submitBtn.disabled = false; }
        return;
    }

    if (document.getElementById('confirmPassword') && password !== confirmPassword) {
        showNotification('Passwords do not match', 'error');
        if (submitBtn) { submitBtn.innerHTML = originalText; submitBtn.disabled = false; }
        return;
    }

    if (document.getElementById('terms') && !terms) {
        showNotification('Please agree to the terms', 'error');
        if (submitBtn) { submitBtn.innerHTML = originalText; submitBtn.disabled = false; }
        return;
    }
    
    if (!validateEmail(email)) {
        showNotification('Please enter a valid email address', 'error');
        if (submitBtn) { submitBtn.innerHTML = originalText; submitBtn.disabled = false; }
        return;
    }

    try {
        // 1. Registrasi dengan Firebase Authentication
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const uid = userCredential.user.uid;

        // 2. Simpan data tambahan ke Firestore (gunakan UID sebagai ID dokumen)
        await setDoc(doc(db, "users", uid), {
            username: username, // Tambahkan username
            email: email,
            role: "user",
            createdAt: firebase.firestore.FieldValue.serverTimestamp() // Gunakan timestamp server Firestore
        });

        showNotification("Berhasil mendaftar! Silakan login.", "success");

        // Arahkan ke halaman login setelah 2 detik
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 2000);

    } catch (error) {
        console.error("Error during registration:", error);
        // Tangani error spesifik dari Firebase Auth
        let errorMessage = error.message;
        if (error.code === 'auth/email-already-in-use') {
            errorMessage = 'Email ini sudah terdaftar. Silakan gunakan email lain.';
        } else if (error.code === 'auth/weak-password') {
            errorMessage = 'Password terlalu lemah. Minimal 6 karakter.';
        }
        showNotification(errorMessage, "error");
    } finally {
        if (submitBtn) {
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    }
});
