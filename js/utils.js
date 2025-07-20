// js/utils.js

// Variabel global untuk pesan toast
const messageToast = document.getElementById('message-toast');

// Fungsi untuk menampilkan pesan error
function showError(message) {
    messageToast.textContent = message;
    messageToast.classList.remove('hidden', 'bg-green-600', 'bg-blue-600');
    messageToast.classList.add('bg-red-600'); // Menggunakan kelas Tailwind yang mungkin di-override oleh Solana CSS
    setTimeout(() => {
        messageToast.classList.add('hidden');
    }, 5000);
}

// Fungsi untuk menampilkan pesan sukses
function showSuccess(message) {
    messageToast.textContent = message;
    messageToast.classList.remove('hidden', 'bg-red-600', 'bg-blue-600');
    messageToast.classList.add('bg-green-600'); // Menggunakan kelas Tailwind yang mungkin di-override oleh Solana CSS
    setTimeout(() => {
        messageToast.classList.add('hidden');
    }, 5000);
}

// Fungsi untuk menampilkan pesan informasi
function showInfo(message) {
    messageToast.textContent = message;
    messageToast.classList.remove('hidden', 'bg-red-600', 'bg-green-600');
    messageToast.classList.add('bg-blue-600'); // Menggunakan kelas Tailwind yang mungkin di-override oleh Solana CSS
    setTimeout(() => {
        messageToast.classList.add('hidden');
    }, 5000);
}

// Fungsi untuk format angka ke Rupiah
function formatRupiah(number) {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0
    }).format(number);
}

// Fungsi untuk mengatur perilaku modal
// Catatan: Fungsi ini mencari elemen berdasarkan ID, pastikan ID di HTML sudah benar.
function setupModal(modalId, openButtonId, closeButtonId, formId) {
    const modal = document.getElementById(modalId);
    const openButton = document.getElementById(openButtonId);
    const closeButton = document.getElementById(closeButtonId);
    const form = document.getElementById(formId);

    if (openButton) {
        openButton.addEventListener('click', () => {
            modal.classList.remove('hidden');
        });
    }

    if (closeButton) {
        closeButton.addEventListener('click', () => {
            modal.classList.add('hidden');
            if (form) {
                form.reset(); // Reset form saat modal ditutup
            }
        });
    }

    // Tutup modal jika klik di luar konten
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.add('hidden');
            if (form) {
                form.reset();
            }
        }
    });
}
