// js/auth.js

// Asumsi 'auth' dan 'db' (Firestore instance) sudah diinisialisasi dan tersedia dari firebaseConfig.js
// Diasumsikan juga showSuccess, showError, showInfo dari utils.js tersedia.
// Diasumsikan juga currentUser, allUsers, allTransactions dari firestore.js akan tersedia
// dari onAuthStateChanged yang memanggil listenForUsers dan listenForTransactions

let currentUser = null; // Variabel global untuk menyimpan data pengguna yang sedang login

// Ambil elemen-elemen UI terkait otentikasi
const authSection = document.getElementById('auth-section');
const dashboardSection = document.getElementById('dashboard-section');
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const showRegisterButton = document.getElementById('show-register');
const showLoginButton = document.getElementById('show-login');
const authTitle = document.getElementById('auth-title');
const hideRegisterSpan = document.getElementById('hide-register');
const logoutButton = document.getElementById('logout-button');
const userInfoSpan = document.getElementById('user-info');
const welcomeUserName = document.getElementById('welcome-user-name');
const adminLoginForm = document.getElementById('admin-login-form');
const adminCodeInput = document.getElementById('admin-code');
const adminMenu = document.getElementById('admin-menu');
const userStatsCard = document.getElementById('user-stats-card');
const dashboardChartCard = document.getElementById('dashboard-chart-card');
const recentTransactionsCard = document.getElementById('recent-transactions-card');

// Listener perubahan state otentikasi
auth.onAuthStateChanged(user => {
    if (user) {
        // User is signed in
        currentUser = user; // Set currentUser global
        console.log('User signed in:', currentUser.uid, currentUser.email);

        // Ambil data user dari Firestore untuk role dan nama
        db.collection('users').doc(user.uid).get().then(doc => {
            if (doc.exists) {
                const userData = doc.data();
                currentUser.role = userData.role || 'user'; // Default to 'user' role
                currentUser.name = userData.name || user.email; // Default to email if name not set
                currentUser.totalIncome = userData.totalIncome || 0;
                currentUser.totalExpense = userData.totalExpense || 0;

                userInfoSpan.textContent = `Login sebagai: ${currentUser.name} (${currentUser.role})`;
                welcomeUserName.textContent = currentUser.name;

                authSection.classList.add('hidden');
                dashboardSection.classList.remove('hidden');

                // Tampilkan menu admin jika user adalah admin
                if (currentUser.role === 'admin') {
                    adminMenu.classList.remove('hidden');
                    userStatsCard.classList.add('hidden'); // Sembunyikan ringkasan user individu untuk admin di dashboard utama
                    dashboardChartCard.classList.remove('hidden'); // Tampilkan chart global untuk admin
                    recentTransactionsCard.classList.remove('hidden'); // Tampilkan transaksi terakhir untuk admin
                    listenForUsers(); // Admin perlu mendengarkan semua user untuk statistik total
                    listenForTransactions(); // Admin perlu mendengarkan semua transaksi
                } else {
                    adminMenu.classList.add('hidden');
                    userStatsCard.classList.remove('hidden'); // Tampilkan ringkasan user individu
                    dashboardChartCard.classList.add('hidden'); // Sembunyikan chart global untuk non-admin
                    recentTransactionsCard.classList.remove('hidden'); // Tampilkan transaksi terakhir untuk user biasa
                    listenForUsers(currentUser.uid); // User biasa hanya perlu mendengarkan dirinya sendiri
                    listenForTransactions(currentUser.uid); // User biasa hanya perlu mendengarkan transaksinya sendiri
                }
            } else {
                console.warn("User data not found in Firestore for:", user.uid);
                // Jika data user tidak ditemukan, mungkin ini user baru yang baru registrasi.
                // Firebase function untuk create user di Firestore akan menangani ini.
                auth.signOut(); // Log out user yang tidak memiliki data di Firestore
                showError("Profil pengguna tidak ditemukan. Silakan login kembali.");
            }
        }).catch(error => {
            console.error("Error getting user data:", error);
            showError("Terjadi kesalahan saat memuat profil: " + error.message);
            auth.signOut();
        });

    } else {
        // User is signed out
        currentUser = null;
        console.log('User signed out.');
        authSection.classList.remove('hidden');
        dashboardSection.classList.add('hidden');
        // Pastikan kembali ke form login default
        loginForm.classList.remove('hidden');
        registerForm.classList.add('hidden');
        authTitle.textContent = 'Login';
        hideRegisterSpan.classList.add('hidden');
        adminLoginForm.classList.add('hidden'); // Sembunyikan form admin saat logout
    }
});

// Event Listener untuk Login
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = loginForm['login-email'].value;
    const password = loginForm['login-password'].value;

    try {
        await auth.signInWithEmailAndPassword(email, password);
        showSuccess('Login berhasil!');
        loginForm.reset();
    } catch (error) {
        showError(error.message);
    }
});

// Event Listener untuk Register
registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = registerForm['register-email'].value;
    const password = registerForm['register-password'].value;
    const name = registerForm['register-name'].value;

    try {
        const res = await auth.createUserWithEmailAndPassword(email, password);
        const user = res.user;

        // Tambahkan data user ke Firestore
        await db.collection('users').doc(user.uid).set({
            name: name,
            email: email,
            role: 'user', // Default role
            totalIncome: 0,
            totalExpense: 0
        });

        showSuccess('Registrasi berhasil! Anda telah login.');
        registerForm.reset();
    } catch (error) {
        showError(error.message);
    }
});

// Event Listener untuk Logout
logoutButton.addEventListener('click', async () => {
    try {
        await auth.signOut();
        showInfo('Anda telah logout.');
    } catch (error) {
        showError(error.message);
    }
});

// Event Listener untuk tombol "Daftar sekarang" (tampilkan form register)
showRegisterButton.addEventListener('click', (e) => {
    e.preventDefault();
    loginForm.classList.add('hidden');
    registerForm.classList.remove('hidden');
    authTitle.textContent = 'Register';
    hideRegisterSpan.classList.remove('hidden');
});

// Event Listener untuk tombol "Login" (tampilkan form login)
showLoginButton.addEventListener('click', (e) => {
    e.preventDefault();
    registerForm.classList.add('hidden');
    loginForm.classList.remove('hidden');
    authTitle.textContent = 'Login';
    hideRegisterSpan.classList.add('hidden');
});

// Event Listener untuk Login Admin
adminLoginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const adminCode = adminCodeInput.value;
    // Ini adalah cara yang SANGAT TIDAK AMAN untuk mengelola kode admin.
    // Seharusnya kode admin diverifikasi di sisi server (Cloud Functions)
    // atau menggunakan sistem role berbasis Firestore Rules.
    // Contoh ini hanya untuk tujuan demonstrasi.
    if (adminCode === 'admin123') { // Ganti dengan kode admin yang lebih aman
        // Jika kode admin benar, log in sebagai admin (jika ada user admin tertentu)
        // ATAU, jika admin login melalui email/password yang sama dengan form login utama,
        // maka role admin akan ditentukan di onAuthStateChanged.
        // Untuk demo ini, kita hanya akan berasumsi bahwa input kode admin ini
        // adalah untuk mengaktifkan fitur admin setelah login sebagai user biasa.
        // Namun, jika Anda memiliki user khusus admin di Firebase Auth,
        // Anda harus melakukan signInWithEmailAndPassword di sini.
        
        // Untuk tujuan demo, kita akan paksa role admin di currentUser
        // Ini HANYA untuk tampilan UI. Security Rules Firestore harus menangani akses sebenarnya.
        if (currentUser) {
            // Update role di Firestore (ini yang benar)
            try {
                const userDocRef = db.collection('users').doc(currentUser.uid);
                await userDocRef.update({ role: 'admin' });
                showSuccess("Berhasil login sebagai Admin (UI). Memuat ulang data...");
                // Memuat ulang data user dan UI setelah role berubah
                // Ini akan memicu onAuthStateChanged lagi atau panggil ulang listenForUsers/Transactions
                auth.currentUser.reload().then(() => {
                    // Paksa onAuthStateChanged untuk berjalan lagi dengan data terbaru
                    // Ini mungkin tidak langsung memicu, jadi lebih baik panggil listenForUsers() langsung
                    console.log("User reloaded. Forcing UI update.");
                    auth.onAuthStateChanged(auth.currentUser); // Panggil manual untuk refresh UI
                });
                adminLoginForm.classList.add('hidden'); // Sembunyikan form admin setelah login
            } catch (updateError) {
                showError("Gagal mengupdate role admin: " + updateError.message);
            }
        } else {
            showError("Silakan login sebagai user terlebih dahulu, lalu masukkan kode admin.");
        }
    } else {
        showError("Kode Admin salah!");
    }
});

// Perhatikan bahwa `populateUserDropdown` dan logika terkait update user total income/expense
// akan dipindahkan ke `firestore.js` karena mereka sangat tergantung pada data Firestore dan
// variabel `allUsers` serta fungsi `listenForUsers`.
