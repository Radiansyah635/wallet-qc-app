// js/main.js

// Pastikan semua script sebelumnya (firebaseConfig.js, utils.js, auth.js, firestore.js, charts.js)
// telah dimuat sebelum main.js di index.html.
// Variabel dan fungsi seperti 'auth', 'db', 'currentUser', 'showSuccess', 'showError',
// 'setupModal', 'addTransaction', 'updateTransaction', 'deleteTransaction',
// 'addAgenda', 'listenForAgendas', 'renderFullTransactions', 'populateUserDropdown',
// 'initDashboardFinanceChart', 'initFullFinanceChart', dll. diharapkan sudah tersedia secara global.

document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM Content Loaded. Initializing app...');

    // --- Setup Modals ---
    setupModal('add-transaction-modal', 'add-transaction-btn', 'close-transaction-modal', 'add-transaction-form');
    setupModal('edit-transaction-modal', null, 'close-edit-transaction-modal', 'edit-transaction-form');
    setupModal('add-agenda-modal', 'add-agenda-btn', 'close-agenda-modal', 'add-agenda-form');

    // --- Navigation / Tab Switching ---
    const navLinks = document.querySelectorAll('.nav-link');
    const sections = document.querySelectorAll('.content-section');
    const adminMenuNavs = document.querySelectorAll('.admin-nav-item');

    function showSection(sectionId) {
        sections.forEach(section => {
            section.classList.add('hidden');
        });
        document.getElementById(sectionId).classList.remove('hidden');
    }

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            navLinks.forEach(item => item.classList.remove('active'));
            adminMenuNavs.forEach(item => item.classList.remove('active')); // Reset admin navs too
            e.currentTarget.classList.add('active');
            const targetSection = e.currentTarget.dataset.target;
            showSection(targetSection);

            // Inisialisasi chart hanya jika di bagian dashboard atau statistik (dan jika belum diinisialisasi)
            if (targetSection === 'dashboard' && currentUser && currentUser.role === 'admin' && !window.dashboardFinanceChart) {
                initDashboardFinanceChart();
            } else if (targetSection === 'finance-stats' && !window.fullFinanceChart) {
                initFullFinanceChart();
            }

            // Panggil render ulang jika perlu saat beralih tab
            if (targetSection === 'finance-stats' && currentUser && currentUser.role === 'admin') {
                renderFullTransactions();
            } else if (targetSection === 'user-management' && currentUser && currentUser.role === 'admin') {
                renderUserTable(); // Render ulang tabel user saat pindah ke tab manajemen user
            } else if (targetSection === 'agenda') {
                listenForAgendas(); // Pastikan listener agenda aktif saat masuk tab agenda
            }
        });
    });

    // Admin menu navigation (jika ada)
    adminMenuNavs.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            navLinks.forEach(item => item.classList.remove('active')); // Reset main navs
            adminMenuNavs.forEach(item => item.classList.remove('active'));
            e.currentTarget.classList.add('active');
            const targetSection = e.currentTarget.dataset.target;
            showSection(targetSection);

            // Inisialisasi chart hanya jika di bagian dashboard atau statistik (dan jika belum diinisialisasi)
            if (targetSection === 'dashboard' && currentUser && currentUser.role === 'admin' && !window.dashboardFinanceChart) {
                initDashboardFinanceChart();
            } else if (targetSection === 'finance-stats' && !window.fullFinanceChart) {
                initFullFinanceChart();
            }

            if (targetSection === 'finance-stats' && currentUser && currentUser.role === 'admin') {
                renderFullTransactions(); // Render semua transaksi untuk admin
            } else if (targetSection === 'user-management' && currentUser && currentUser.role === 'admin') {
                renderUserTable(); // Render ulang tabel user saat pindah ke tab manajemen user
            } else if (targetSection === 'agenda') {
                listenForAgendas(); // Pastikan listener agenda aktif saat masuk tab agenda
            }
        });
    });


    // --- Form Submissions ---

    // Form Tambah Transaksi
    const addTransactionForm = document.getElementById('add-transaction-form');
    if (addTransactionForm) {
        addTransactionForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const userId = addTransactionForm['transaction-user'].value;
            const type = addTransactionForm['transaction-type'].value;
            const amount = parseFloat(addTransactionForm['transaction-amount'].value);
            const description = addTransactionForm['transaction-desc'].value;

            if (isNaN(amount) || amount <= 0) {
                showError('Jumlah harus angka positif.');
                return;
            }

            try {
                await addTransaction(userId, type, amount, description);
                showSuccess('Transaksi berhasil ditambahkan!');
                addTransactionForm.reset();
                document.getElementById('add-transaction-modal').classList.add('hidden');
            } catch (error) {
                console.error("Error adding transaction:", error);
                showError('Gagal menambahkan transaksi: ' + error.message);
            }
        });
    }

    // Form Edit Transaksi
    const editTransactionForm = document.getElementById('edit-transaction-form');
    if (editTransactionForm) {
        editTransactionForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const transactionId = editTransactionForm['edit-transaction-id'].value;
            const userId = editTransactionForm['edit-transaction-user'].value;
            const newType = editTransactionForm['edit-transaction-type'].value;
            const newAmount = parseFloat(editTransactionForm['edit-transaction-amount'].value);
            const newDescription = editTransactionForm['edit-transaction-desc'].value;

            if (isNaN(newAmount) || newAmount <= 0) {
                showError('Jumlah harus angka positif.');
                return;
            }

            const oldTransaction = allTransactions.find(t => t.id === transactionId);
            if (!oldTransaction) {
                showError('Transaksi lama tidak ditemukan.');
                return;
            }

            try {
                await updateTransaction(
                    transactionId,
                    userId,
                    oldTransaction.type,
                    oldTransaction.amount,
                    newType,
                    newAmount,
                    newDescription
                );
                showSuccess('Transaksi berhasil diupdate!');
                editTransactionForm.reset();
                document.getElementById('edit-transaction-modal').classList.add('hidden');
            } catch (error) {
                console.error("Error updating transaction:", error);
                showError('Gagal mengupdate transaksi: ' + error.message);
            }
        });
    }

    // Form Tambah Agenda
    const addAgendaForm = document.getElementById('add-agenda-form');
    if (addAgendaForm) {
        addAgendaForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const title = addAgendaForm['agenda-title'].value;
            const description = addAgendaForm['agenda-description'].value;
            const date = addAgendaForm['agenda-date'].value; // Format YYYY-MM-DD

            if (!currentUser) {
                showError('Anda harus login untuk menambah agenda.');
                return;
            }

            try {
                await addAgenda(title, description, date, currentUser.uid);
                showSuccess('Agenda berhasil ditambahkan!');
                addAgendaForm.reset();
                document.getElementById('add-agenda-modal').classList.add('hidden');
            } catch (error) {
                console.error("Error adding agenda:", error);
                showError('Gagal menambahkan agenda: ' + error.message);
            }
        });
    }

    // --- Filtering Transaksi ---
    const userFilterSelect = document.getElementById('user-filter-select');
    if (userFilterSelect) {
        userFilterSelect.addEventListener('change', () => {
            const selectedUserId = userFilterSelect.value;
            let filteredTransactions = [];
            if (selectedUserId) {
                filteredTransactions = allTransactions.filter(t => t.userId === selectedUserId);
            } else {
                filteredTransactions = allTransactions; // Semua transaksi jika filter kosong
            }
            renderFullTransactions(filteredTransactions);
        });
    }

    // --- PDF Generation ---
    const exportPdfButton = document.getElementById('export-pdf-btn');
    if (exportPdfButton) {
        exportPdfButton.addEventListener('click', () => {
            // Pastikan jspdf dan jspdf-autotable sudah dimuat
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();

            doc.setFontSize(18);
            doc.text("Laporan Transaksi Keuangan", 14, 22);

            const tableColumn = ["User", "Tipe", "Jumlah", "Deskripsi", "Tanggal"];
            const tableRows = [];

            // Tentukan transaksi yang akan diekspor (sesuai filter jika ada)
            const currentFilteredTransactions = userFilterSelect && userFilterSelect.value
                ? allTransactions.filter(t => t.userId === userFilterSelect.value)
                : allTransactions;

            currentFilteredTransactions.sort((a, b) => a.timestamp.toDate() - b.timestamp.toDate())
                                     .forEach(transaction => {
                const userName = allUsers.find(u => u.id === transaction.userId)?.name || 'Unknown User';
                const transactionData = [
                    userName,
                    transaction.type === 'masuk' ? 'Kas Masuk' : 'Kas Keluar',
                    formatRupiah(transaction.amount),
                    transaction.description,
                    transaction.timestamp.toDate().toLocaleDateString('id-ID')
                ];
                tableRows.push(transactionData);
            });

            doc.autoTable(tableColumn, tableRows, { startY: 30 });
            doc.save('laporan_transaksi.pdf');
            showSuccess('Laporan PDF berhasil dibuat!');
        });
    }

    // --- Inisialisasi awal listener data setelah DOMContentLoaded ---
    // Listeners ini akan dijalankan saat onAuthStateChanged di auth.js memicu update
    // Ini memastikan data dimuat setelah user terautentikasi dan role-nya diketahui.
    // Jika tidak diadmin atau user biasa, maka data tidak akan terload, sehingga tidak ada error.
    
    // Default show dashboard (akan ditangani oleh onAuthStateChanged)
    showSection('auth-section'); // Awalnya sembunyikan semua dan tampilkan auth

    // Initial check for currentUser to set up listeners if user is already logged in on page load
    // (e.g., if page was refreshed and Firebase persists login state)
    // This is often redundant because auth.onAuthStateChanged usually handles it.
    // However, explicit calls ensure data listeners are set up correctly.
    if (auth.currentUser) {
        // These will be called again by auth.onAuthStateChanged, but good for clarity.
        // The real calls are in auth.onAuthStateChanged based on user role.
        console.log('User already logged in. Initializing listeners via auth.onAuthStateChanged.');
    }
});
