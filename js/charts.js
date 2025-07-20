// js/charts.js

// Asumsi Chart.js sudah dimuat di index.html
// Asumsi 'currentUser' dari auth.js sudah tersedia global.

let dashboardFinanceChart; // Chart untuk dashboard admin
let fullFinanceChart;      // Chart untuk halaman statistik keuangan

// Fungsi untuk menginisialisasi chart di dashboard admin
function initDashboardFinanceChart() {
    const ctx = document.getElementById('dashboardFinanceChart').getContext('2d');
    dashboardFinanceChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Kas Masuk', 'Kas Keluar'],
            datasets: [{
                label: 'Jumlah (Rp)',
                data: [0, 0], // Data awal, akan diupdate oleh firestore.js
                backgroundColor: [
                    'rgba(0, 255, 163, 0.7)', // Warna Solana primary/success
                    'rgba(255, 77, 77, 0.7)'  // Warna Solana danger
                ],
                borderColor: [
                    'rgba(0, 255, 163, 1)',
                    'rgba(255, 77, 77, 1)'
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return 'Rp ' + context.raw.toLocaleString('id-ID');
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return 'Rp ' + value.toLocaleString('id-ID');
                        },
                        color: 'var(--solana-text-secondary)' // Warna teks sumbu Y
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)' // Warna grid
                    }
                },
                x: {
                    ticks: {
                        color: 'var(--solana-text-secondary)' // Warna teks sumbu X
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)' // Warna grid
                    }
                }
            }
        }
    });
}

// Fungsi untuk menginisialisasi chart di halaman statistik keuangan
function initFullFinanceChart() {
    const ctx = document.getElementById('fullFinanceChart').getContext('2d');
    fullFinanceChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Kas Masuk', 'Kas Keluar'],
            datasets: [{
                label: 'Jumlah (Rp)',
                data: [0, 0], // Data awal, akan diupdate oleh firestore.js
                backgroundColor: [
                    'rgba(0, 255, 163, 0.7)',
                    'rgba(255, 77, 77, 0.7)'
                ],
                borderColor: [
                    'rgba(0, 255, 163, 1)',
                    'rgba(255, 77, 77, 1)'
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return 'Rp ' + context.raw.toLocaleString('id-ID');
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return 'Rp ' + value.toLocaleString('id-ID');
                        },
                        color: 'var(--solana-text-secondary)'
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    }
                },
                x: {
                    ticks: {
                        color: 'var(--solana-text-secondary)'
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    }
                }
            }
        }
    });
}

// Fungsi untuk mengupdate chart berdasarkan data yang diberikan
// Fungsi ini akan dipanggil dari firestore.js setelah data di-fetch
function updateDashboardFinanceChart(income, expense) {
    if (dashboardFinanceChart) {
        dashboardFinanceChart.data.datasets[0].data = [income, expense];
        dashboardFinanceChart.update();
    }
}

function updateFullFinanceChart(income, expense) {
    if (fullFinanceChart) {
        fullFinanceChart.data.datasets[0].data = [income, expense];
        fullFinanceChart.update();
    }
}

// Inisialisasi chart saat skrip ini dimuat
// Namun, inisialisasi ini perlu dipastikan hanya berjalan saat elemen canvas ada
// dan setelah user login sebagai admin untuk chart dashboard, atau di halaman statistik
// Kita akan panggil ini secara kondisional di main.js atau di onAuthStateChanged di auth.js
// Untuk saat ini, fungsi ini hanya didefinisikan, tidak langsung dipanggil.
// Panggilan akan ada di main.js atau di bagian mana chart ditampilkan.
