// js/firestore.js

// Asumsi 'db' (Firestore instance), 'auth' dari firebaseConfig.js sudah tersedia.
// Asumsi juga showSuccess, showError, showInfo, formatRupiah dari utils.js sudah tersedia.
// Asumsi 'currentUser' dari auth.js sudah tersedia global.
// Asumsi chart instances dari charts.js akan tersedia atau fungsi update chart akan dipanggil.

const usersRef = db.collection('users');
const transactionsRef = db.collection('transactions');
const agendasRef = db.collection('agendas');

let allUsers = []; // Menyimpan semua data pengguna
let allTransactions = []; // Menyimpan semua data transaksi
let allAgendas = []; // Menyimpan semua data agenda

// Ambil elemen-elemen UI
const userTableBody = document.getElementById('user-table-body');
const userIncomeSpan = document.getElementById('user-income');
const userExpenseSpan = document.getElementById('user-expense');
const userBalanceSpan = document.getElementById('user-balance');

const totalUsersSpan = document.getElementById('total-users');
const totalIncomeSpan = document.getElementById('total-income');
const totalExpenseSpan = document.getElementById('total-expense');

const recentTransactionsBody = document.getElementById('recent-transactions-body');
const fullTransactionsBody = document.getElementById('full-transactions-body');

const transactionUserSelect = document.getElementById('transaction-user');
const editTransactionUserSelect = document.getElementById('edit-transaction-user');
const userFilterSelect = document.getElementById('user-filter-select');

// Fungsi untuk memperbarui ringkasan keuangan pengguna individu
function updateUserSummary() {
    if (currentUser && currentUser.role === 'user') {
        const income = currentUser.totalIncome || 0;
        const expense = currentUser.totalExpense || 0;
        const balance = income - expense;

        userIncomeSpan.textContent = formatRupiah(income);
        userExpenseSpan.textContent = formatRupiah(expense);
        userBalanceSpan.textContent = formatRupiah(balance);
    }
}

// Fungsi untuk memperbarui total kas admin
function updateAdminTotals() {
    let totalIncomeQC = 0;
    let totalExpenseQC = 0;

    allUsers.forEach(user => {
        totalIncomeQC += user.totalIncome || 0;
        totalExpenseQC += user.totalExpense || 0;
    });

    totalUsersSpan.textContent = allUsers.length;
    totalIncomeSpan.textContent = formatRupiah(totalIncomeQC);
    totalExpenseSpan.textContent = formatRupiah(totalExpenseQC);

    // Update Chart di Dashboard Admin (jika chart sudah diinisialisasi di charts.js)
    if (window.dashboardFinanceChart) {
        window.dashboardFinanceChart.data.datasets[0].data = [totalIncomeQC, totalExpenseQC];
        window.dashboardFinanceChart.update();
    }

    // Update Full Finance Chart (jika chart sudah diinisialisasi di charts.js)
    if (window.fullFinanceChart) {
        document.getElementById('full-total-income').textContent = formatRupiah(totalIncomeQC);
        document.getElementById('full-total-expense').textContent = formatRupiah(totalExpenseQC);
        document.getElementById('full-total-saldo').textContent = formatRupiah(totalIncomeQC - totalExpenseQC);
        window.fullFinanceChart.data.datasets[0].data = [totalIncomeQC, totalExpenseQC];
        window.fullFinanceChart.update();
    }
}

// Fungsi untuk me-render tabel pengguna
function renderUserTable() {
    userTableBody.innerHTML = '';
    allUsers.forEach(user => {
        const row = userTableBody.insertRow();
        row.innerHTML = `
            <td class="py-2 px-4 border-b">${user.name}</td>
            <td class="py-2 px-4 border-b">${user.email}</td>
            <td class="py-2 px-4 border-b">${user.role}</td>
            <td class="py-2 px-4 border-b">${formatRupiah(user.totalIncome || 0)}</td>
            <td class="py-2 px-4 border-b">${formatRupiah(user.totalExpense || 0)}</td>
            <td class="py-2 px-4 border-b">${formatRupiah((user.totalIncome || 0) - (user.totalExpense || 0))}</td>
            <td class="py-2 px-4 border-b">
                <button class="bg-red-500 hover:bg-red-600 text-white font-bold py-1 px-3 rounded text-xs delete-user-btn" data-uid="${user.id}">Hapus</button>
            </td>
        `;
    });

    // Tambahkan event listener untuk tombol hapus
    document.querySelectorAll('.delete-user-btn').forEach(button => {
        button.addEventListener('click', async (e) => {
            const userId = e.target.dataset.uid;
            if (confirm('Apakah Anda yakin ingin menghapus pengguna ini dan semua transaksinya?')) {
                try {
                    await deleteUserAndTransactions(userId);
                    showSuccess('Pengguna berhasil dihapus.');
                } catch (error) {
                    showError('Gagal menghapus pengguna: ' + error.message);
                }
            }
        });
    });
}

// Fungsi untuk me-render tabel transaksi (recent)
function renderRecentTransactions() {
    recentTransactionsBody.innerHTML = '';
    const displayTransactions = currentUser && currentUser.role === 'admin' ? allTransactions : allTransactions.filter(t => t.userId === currentUser.uid);

    // Ambil 5 transaksi terakhir
    displayTransactions.sort((a, b) => b.timestamp.toDate() - a.timestamp.toDate())
                       .slice(0, 5)
                       .forEach(transaction => {
        const row = recentTransactionsBody.insertRow();
        const userName = allUsers.find(u => u.id === transaction.userId)?.name || 'Unknown User';
        row.innerHTML = `
            <td class="py-2 px-4 border-b">${userName}</td>
            <td class="py-2 px-4 border-b ${transaction.type === 'masuk' ? 'text-green-600' : 'text-red-600'} font-semibold">${transaction.type === 'masuk' ? 'Kas Masuk' : 'Kas Keluar'}</td>
            <td class="py-2 px-4 border-b">${formatRupiah(transaction.amount)}</td>
            <td class="py-2 px-4 border-b">${transaction.description}</td>
            <td class="py-2 px-4 border-b">${transaction.timestamp.toDate().toLocaleDateString('id-ID')}</td>
        `;
    });
}

// Fungsi untuk me-render tabel transaksi lengkap (di bagian statistik keuangan)
function renderFullTransactions(transactionsToRender = allTransactions) {
    fullTransactionsBody.innerHTML = '';
    transactionsToRender.sort((a, b) => b.timestamp.toDate() - a.timestamp.toDate())
                       .forEach(transaction => {
        const row = fullTransactionsBody.insertRow();
        const userName = allUsers.find(u => u.id === transaction.userId)?.name || 'Unknown User';
        row.innerHTML = `
            <td class="py-2 px-4 border-b">${userName}</td>
            <td class="py-2 px-4 border-b ${transaction.type === 'masuk' ? 'text-green-600' : 'text-red-600'} font-semibold">${transaction.type === 'masuk' ? 'Kas Masuk' : 'Kas Keluar'}</td>
            <td class="py-2 px-4 border-b">${formatRupiah(transaction.amount)}</td>
            <td class="py-2 px-4 border-b">${transaction.description}</td>
            <td class="py-2 px-4 border-b">${transaction.timestamp.toDate().toLocaleDateString('id-ID')}</td>
            <td class="py-2 px-4 border-b">
                <button class="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-1 px-3 rounded text-xs edit-transaction-btn" data-id="${transaction.id}">Edit</button>
                <button class="bg-red-500 hover:bg-red-600 text-white font-bold py-1 px-3 rounded text-xs delete-transaction-btn" data-id="${transaction.id}">Hapus</button>
            </td>
        `;
    });

    // Tambahkan event listener untuk tombol edit dan hapus
    document.querySelectorAll('.edit-transaction-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            const transactionId = e.target.dataset.id;
            editTransaction(transactionId);
        });
    });
    document.querySelectorAll('.delete-transaction-btn').forEach(button => {
        button.addEventListener('click', async (e) => {
            const transactionId = e.target.dataset.id;
            if (confirm('Apakah Anda yakin ingin menghapus transaksi ini?')) {
                try {
                    await deleteTransaction(transactionId);
                    showSuccess('Transaksi berhasil dihapus.');
                } catch (error) {
                    showError('Gagal menghapus transaksi: ' + error.message);
                }
            }
        });
    });
}

// Fungsi untuk mengisi dropdown pilihan user
function populateUserDropdown() {
    transactionUserSelect.innerHTML = '';
    editTransactionUserSelect.innerHTML = '';
    userFilterSelect.innerHTML = '<option value="">Semua User</option>'; // Opsi default untuk filter

    allUsers.forEach(user => {
        const option = document.createElement('option');
        option.value = user.id;
        option.textContent = user.name;
        transactionUserSelect.appendChild(option);

        const editOption = option.cloneNode(true);
        editTransactionUserSelect.appendChild(editOption);

        const filterOption = option.cloneNode(true);
        userFilterSelect.appendChild(filterOption);
    });
}

// LISTENERS FIREBASE FIRESTORE
// Mendengarkan perubahan pada koleksi 'users'
function listenForUsers(userId = null) {
    let query = usersRef;
    if (userId) {
        query = usersRef.where(firebase.firestore.FieldPath.documentId(), '==', userId);
    }

    query.onSnapshot(snapshot => {
        allUsers = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        // Update current user's income/expense if it's a user and not admin
        if (currentUser && currentUser.role === 'user') {
            const updatedCurrentUser = allUsers.find(u => u.id === currentUser.uid);
            if (updatedCurrentUser) {
                currentUser.totalIncome = updatedCurrentUser.totalIncome || 0;
                currentUser.totalExpense = updatedCurrentUser.totalExpense || 0;
                updateUserSummary();
            }
        }
        
        if (currentUser && currentUser.role === 'admin') {
            updateAdminTotals(); // Update totals for admin view
            renderUserTable(); // Render user table for admin
        }
        
        populateUserDropdown(); // Update dropdowns with latest user list
    }, error => {
        console.error("Error listening to users:", error);
        showError("Gagal memuat data pengguna: " + error.message);
    });
}

// Mendengarkan perubahan pada koleksi 'transactions'
function listenForTransactions(userId = null) {
    let query = transactionsRef.orderBy('timestamp', 'desc'); // Urutkan berdasarkan waktu terbaru

    // Jika user bukan admin, filter berdasarkan userId
    if (userId && currentUser.role !== 'admin') {
        query = query.where('userId', '==', userId);
    }

    query.onSnapshot(snapshot => {
        allTransactions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        renderRecentTransactions(); // Render transaksi terbaru di dashboard
        if (currentUser && currentUser.role === 'admin') {
            renderFullTransactions(); // Render semua transaksi di halaman statistik
            // Jika admin, update chart finance total
            updateAdminTotals(); // Pastikan total admin diupdate juga
        }
    }, error => {
        console.error("Error listening to transactions:", error);
        showError("Gagal memuat data transaksi: " + error.message);
    });
}


// Fungsi untuk menambahkan transaksi baru
async function addTransaction(userId, type, amount, description) {
    const batch = db.batch();
    const newTransactionRef = transactionsRef.doc(); // Buat ID dokumen baru

    batch.set(newTransactionRef, {
        userId: userId,
        type: type,
        amount: amount,
        description: description,
        timestamp: firebase.firestore.FieldValue.serverTimestamp() // Gunakan timestamp server
    });

    // Update total income/expense user
    const userDocRef = usersRef.doc(userId);
    if (type === 'masuk') {
        batch.update(userDocRef, {
            totalIncome: firebase.firestore.FieldValue.increment(amount)
        });
    } else { // type === 'keluar'
        batch.update(userDocRef, {
            totalExpense: firebase.firestore.FieldValue.increment(amount)
        });
    }

    await batch.commit();
}

// Fungsi untuk mengedit transaksi
async function editTransaction(transactionId) {
    const transaction = allTransactions.find(t => t.id === transactionId);
    if (!transaction) {
        showError('Transaksi tidak ditemukan.');
        return;
    }

    document.getElementById('edit-transaction-id').value = transaction.id;
    document.getElementById('edit-transaction-user').value = transaction.userId;
    document.getElementById('edit-transaction-type').value = transaction.type;
    document.getElementById('edit-transaction-amount').value = transaction.amount;
    document.getElementById('edit-transaction-desc').value = transaction.description;

    document.getElementById('edit-transaction-modal').classList.remove('hidden');
}

// Fungsi untuk menyimpan perubahan transaksi
async function updateTransaction(transactionId, userId, oldType, oldAmount, newType, newAmount, newDescription) {
    const batch = db.batch();
    const transactionDocRef = transactionsRef.doc(transactionId);
    const userDocRef = usersRef.doc(userId);

    // 1. Rollback perubahan total income/expense dari transaksi lama
    if (oldType === 'masuk') {
        batch.update(userDocRef, {
            totalIncome: firebase.firestore.FieldValue.increment(-oldAmount)
        });
    } else {
        batch.update(userDocRef, {
            totalExpense: firebase.firestore.FieldValue.increment(-oldAmount)
        });
    }

    // 2. Terapkan perubahan total income/expense dari transaksi baru
    if (newType === 'masuk') {
        batch.update(userDocRef, {
            totalIncome: firebase.firestore.FieldValue.increment(newAmount)
        });
    } else {
        batch.update(userDocRef, {
            totalExpense: firebase.firestore.FieldValue.increment(newAmount)
        });
    }

    // 3. Update dokumen transaksi itu sendiri
    batch.update(transactionDocRef, {
        type: newType,
        amount: newAmount,
        description: newDescription
        // timestamp tidak diubah saat edit
    });

    await batch.commit();
}

// Fungsi untuk menghapus transaksi
async function deleteTransaction(transactionId) {
    const transaction = allTransactions.find(t => t.id === transactionId);
    if (!transaction) {
        throw new Error('Transaksi tidak ditemukan.');
    }

    const batch = db.batch();
    const transactionDocRef = transactionsRef.doc(transactionId);
    const userDocRef = usersRef.doc(transaction.userId);

    // Hapus dokumen transaksi
    batch.delete(transactionDocRef);

    // Rollback total income/expense user
    if (transaction.type === 'masuk') {
        batch.update(userDocRef, {
            totalIncome: firebase.firestore.FieldValue.increment(-transaction.amount)
        });
    } else { // type === 'keluar'
        batch.update(userDocRef, {
            totalExpense: firebase.firestore.FieldValue.increment(-transaction.amount)
        });
    }

    await batch.commit();
}

// Fungsi untuk menghapus pengguna dan semua transaksinya
async function deleteUserAndTransactions(userId) {
    const batch = db.batch();

    // 1. Hapus semua transaksi milik pengguna ini
    const userTransactionsSnapshot = await transactionsRef.where('userId', '==', userId).get();
    userTransactionsSnapshot.forEach(doc => {
        batch.delete(doc.ref);
    });

    // 2. Hapus dokumen pengguna itu sendiri
    const userDocRef = usersRef.doc(userId);
    batch.delete(userDocRef);

    await batch.commit();
}


// AGENDA FUNCTIONS
// Fungsi untuk menambahkan agenda baru
async function addAgenda(title, description, date, userId) {
    await agendasRef.add({
        title: title,
        description: description,
        date: date, // Simpan sebagai string YYYY-MM-DD
        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
        userId: userId // Simpan user yang membuat agenda
    });
}

// Fungsi untuk mendengarkan perubahan pada koleksi 'agendas'
function listenForAgendas() {
    agendasRef.orderBy('date', 'asc').onSnapshot(snapshot => {
        allAgendas = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        renderAgendaList();
    }, error => {
        console.error("Error listening to agendas:", error);
        showError("Gagal memuat agenda: " + error.message);
    });
}

// Fungsi untuk me-render daftar agenda
function renderAgendaList() {
    const agendaListDiv = document.getElementById('agenda-list');
    if (!agendaListDiv) return; // Pastikan elemen ada

    agendaListDiv.innerHTML = '';
    if (allAgendas.length === 0) {
        agendaListDiv.innerHTML = '<p class="text-center text-gray-500">Belum ada agenda.</p>';
        return;
    }

    allAgendas.forEach(agenda => {
        const dateObj = new Date(agenda.date + 'T00:00:00'); // Pastikan zona waktu agar tanggal tidak bergeser
        const formattedDate = dateObj.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        const createdBy = allUsers.find(u => u.id === agenda.userId)?.name || 'Unknown';

        const agendaCard = document.createElement('div');
        agendaCard.classList.add('card', 'agenda-card'); // Menggunakan kelas card Solana-style

        agendaCard.innerHTML = `
            <div class="agenda-date">${dateObj.getDate()} <br> ${dateObj.toLocaleString('id-ID', { month: 'short' })}</div>
            <div class="agenda-badge">${agenda.userId === currentUser.uid ? 'Milik Anda' : 'Public'}</div>
            <div class="agenda-content">
                <h3 class="agenda-title">${agenda.title}</h3>
                <p>${agenda.description}</p>
                <div class="agenda-meta text-sm">
                    <span><i class="fas fa-calendar-alt"></i> ${formattedDate}</span>
                    <span><i class="fas fa-user"></i> ${createdBy}</span>
                </div>
                <div class="mt-4 flex space-x-2">
                    <button class="bg-red-500 hover:bg-red-600 text-white font-bold py-1 px-3 rounded text-xs delete-agenda-btn" data-id="${agenda.id}">Hapus</button>
                    </div>
            </div>
        `;
        agendaListDiv.appendChild(agendaCard);
    });

    // Event listener untuk tombol hapus agenda
    document.querySelectorAll('.delete-agenda-btn').forEach(button => {
        button.addEventListener('click', async (e) => {
            const agendaId = e.target.dataset.id;
            const agendaToDelete = allAgendas.find(a => a.id === agendaId);
            // Hanya izinkan admin atau pembuat agenda untuk menghapus
            if (currentUser.role === 'admin' || (agendaToDelete && agendaToDelete.userId === currentUser.uid)) {
                if (confirm('Apakah Anda yakin ingin menghapus agenda ini?')) {
                    try {
                        await deleteAgenda(agendaId);
                        showSuccess('Agenda berhasil dihapus.');
                    } catch (error) {
                        showError('Gagal menghapus agenda: ' + error.message);
                    }
                }
            } else {
                showError('Anda tidak memiliki izin untuk menghapus agenda ini.');
            }
        });
    });
}

// Fungsi untuk menghapus agenda
async function deleteAgenda(agendaId) {
    await agendasRef.doc(agendaId).delete();
}


// Ekspor fungsi-fungsi yang perlu diakses secara global oleh main.js atau auth.js
// Meskipun saat ini mereka global, ini adalah praktik yang baik jika Anda beralih ke modul ES6.
// For now, these functions are implicitly global because they are in script tags.
// window.listenForUsers = listenForUsers;
// window.listenForTransactions = listenForTransactions;
// window.addTransaction = addTransaction;
// window.updateTransaction = updateTransaction;
// window.deleteTransaction = deleteTransaction;
// window.deleteUserAndTransactions = deleteUserAndTransactions;
// window.populateUserDropdown = populateUserDropdown;
// window.addAgenda = addAgenda;
// window.listenForAgendas = listenForAgendas;
