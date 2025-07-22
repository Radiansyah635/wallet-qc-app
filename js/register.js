// Firebase Imports
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";
import { 
  getAuth, 
  createUserWithEmailAndPassword 
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";
import { 
  getFirestore, 
  doc, 
  setDoc, 
  serverTimestamp // Perbaikan 1: Impor serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

// Konfigurasi Firebase
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

// Fungsi toggle password visibility
const togglePassword = document.getElementById('togglePassword');
const passwordInput = document.getElementById('password');
const toggleConfirmPassword = document.getElementById('toggleConfirmPassword');
const confirmPasswordInput = document.getElementById('confirmPassword');

function togglePasswordVisibility(inputElement, toggleElement) {
  const type = inputElement.getAttribute('type') === 'password' ? 'text' : 'password';
  inputElement.setAttribute('type', type);
  toggleElement.innerHTML = type === 'password' ? '<i class="fas fa-eye"></i>' : '<i class="fas fa-eye-slash"></i>';
}

if (togglePassword && passwordInput) {
  togglePassword.addEventListener('click', () => togglePasswordVisibility(passwordInput, togglePassword));
}
if (toggleConfirmPassword && confirmPasswordInput) {
  toggleConfirmPassword.addEventListener('click', () => togglePasswordVisibility(confirmPasswordInput, toggleConfirmPassword));
}

// Fungsi show notification
function showNotification(messageText, type = "success") {
  const messageElement = document.getElementById('message');
  if (messageElement) {
    messageElement.textContent = messageText;
    messageElement.classList.remove('text-green-500', 'text-red-500');
    
    if (type === "success") {
      messageElement.classList.add('text-green-500');
    } else if (type === "error") {
      messageElement.classList.add('text-red-500');
    }
    
    // Tambahkan efek hilang setelah 5 detik
    setTimeout(() => {
      messageElement.textContent = '';
      messageElement.classList.remove('text-green-500', 'text-red-500');
    }, 5000);
  }
}

// Fungsi validasi email
function validateEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

// Password strength meter
if (passwordInput) {
  passwordInput.addEventListener('input', function() {
    const password = this.value;
    const meter = document.getElementById('strengthMeter');
    const text = document.getElementById('strengthText');
    
    if (!meter || !text) return;
    
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

// Fungsi create particles
function createParticles() {
  const particlesContainer = document.getElementById('particles');
  if (!particlesContainer) return;
  
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

// Inisialisasi halaman
document.addEventListener('DOMContentLoaded', function() {
  createParticles();
});

// Logic Form Submission Utama dengan Firebase
document.getElementById('registerForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const username = document.getElementById('username').value.trim();
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value.trim();
  const confirmPassword = document.getElementById('confirmPassword').value.trim();
  const terms = document.getElementById('terms').checked;

  const submitBtn = document.querySelector('#registerForm button[type="submit"]');
  const originalText = submitBtn.innerHTML;
  
  // Tampilkan loading state
  submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating account...';
  submitBtn.disabled = true;

  // Validasi
  if (!username || !email || !password || !confirmPassword) {
    showNotification('Please fill in all fields', 'error');
    submitBtn.innerHTML = originalText;
    submitBtn.disabled = false;
    return;
  }

  if (password !== confirmPassword) {
    showNotification('Passwords do not match', 'error');
    submitBtn.innerHTML = originalText;
    submitBtn.disabled = false;
    return;
  }

  if (!terms) {
    showNotification('Please agree to the terms', 'error');
    submitBtn.innerHTML = originalText;
    submitBtn.disabled = false;
    return;
  }
  
  if (!validateEmail(email)) {
    showNotification('Please enter a valid email address', 'error');
    submitBtn.innerHTML = originalText;
    submitBtn.disabled = false;
    return;
  }

  try {
    // 1. Registrasi dengan Firebase Authentication
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const uid = userCredential.user.uid;

    // 2. Simpan data tambahan ke Firestore
    await setDoc(doc(db, "users", uid), {
      username: username,
      email: email,
      role: "user",
      createdAt: serverTimestamp() // Perbaikan 2: Gunakan serverTimestamp yang diimpor
    });

    showNotification("Registration successful! Redirecting to login...", "success");

    // 3. Redirect ke halaman login setelah 2 detik
    setTimeout(() => {
      // Perbaikan 3: Pastikan path ke login.html benar
      window.location.href = '../login.html'; // Sesuaikan dengan struktur folder Anda
    }, 2000);

  } catch (error) {
    console.error("Error during registration:", error);
    
    // Perbaikan 4: Tambahkan penanganan error lebih lengkap
    let errorMessage = "Registration failed. Please try again.";
    
    switch (error.code) {
      case 'auth/email-already-in-use':
        errorMessage = 'Email already in use. Please use another email.';
        break;
      case 'auth/weak-password':
        errorMessage = 'Password is too weak. Minimum 6 characters required.';
        break;
      case 'auth/invalid-email':
        errorMessage = 'Invalid email format. Please enter a valid email.';
        break;
      case 'auth/operation-not-allowed':
        errorMessage = 'Email/password accounts are not enabled. Contact support.';
        break;
      case 'auth/too-many-requests':
        errorMessage = 'Too many requests. Please try again later.';
        break;
    }
    
    showNotification(errorMessage, "error");
    submitBtn.innerHTML = originalText;
    submitBtn.disabled = false;
  }
});
