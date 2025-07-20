import { getTransactions } from './firestore.js';

export const renderFinanceChart = async () => {
  try {
    const transactions = await getTransactions();
    
    // Proses data untuk chart
    const ctx = document.getElementById('finance-chart').getContext('2d');
    new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['Jan', 'Feb', 'Mar'],
        datasets: [{
          label: 'Transaksi',
          data: [10, 20, 30]
        }]
      }
    });
  } catch (error) {
    console.error("Error rendering chart:", error);
  }
};
