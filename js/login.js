document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;

      // Contoh login logika, bisa disambungkan ke Firebase nanti
      if (email === "admin@example.com" && password === "admin123") {
        alert("Login berhasil!");
        window.location.href = "dashboard.html";
      } else {
        alert("Email atau password salah");
      }
    });
  }
});
