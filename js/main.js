import { loginUser, registerUser, logoutUser } from './auth.js';
import { renderFinanceChart } from './charts.js';
import { showError } from './utils.js';

document.addEventListener('DOMContentLoaded', () => {
  // Inisialisasi
  initAuth();
  renderFinanceChart();
});

function initAuth() {
  // Login Form
  document.getElementById('login-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
      await loginUser(
        document.getElementById('login-email').value,
        document.getElementById('login-password').value
      );
      window.location.href = '/dashboard';
    } catch (error) {
      showError(error.message);
    }
  });

  // Logout Button
  document.getElementById('logout-btn')?.addEventListener('click', async () => {
    try {
      await logoutUser();
    } catch (error) {
      showError(error.message);
    }
  });
}
