// Format mata uang Rupiah
export const formatRupiah = (amount) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(amount);
};

// Format tanggal Indonesia
export const formatDate = (dateString) => {
  const date = new Date(dateString);
  const options = { 
    weekday: 'long', 
    day: 'numeric', 
    month: 'long', 
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  };
  return new Intl.DateTimeFormat('id-ID', options).format(date);
};

// Animasi masuk komponen
export const animateIn = (element) => {
  element.style.opacity = '0';
  element.style.transform = 'translateY(20px)';
  
  setTimeout(() => {
    element.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
    element.style.opacity = '1';
    element.style.transform = 'translateY(0)';
  }, 50);
};

// Deteksi perubahan auth state
export const initAuthState = () => {
  firebase.auth().onAuthStateChanged(user => {
    if (user) {
      // User is signed in
      document.body.classList.add('authenticated');
      document.body.classList.remove('unauthenticated');
      
      // Load user data
      loadUserData(user.uid);
      
      // Tampilkan dashboard sesuai role
      checkUserRole(user.uid);
    } else {
      // User is signed out
      document.body.classList.add('unauthenticated');
      document.body.classList.remove('authenticated');
      loadComponent('login');
    }
  });
};

// Load komponen secara dinamis
export const loadComponent = async (componentName) => {
  try {
    const appElement = document.getElementById('app');
    
    // Animasi keluar
    appElement.style.opacity = '0';
    appElement.style.transform = 'translateY(-20px)';
    
    // Tunggu animasi selesai
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Load komponen HTML
    const response = await fetch(`components/${componentName}.html`);
    const html = await response.text();
    
    // Set HTML baru
    appElement.innerHTML = html;
    
    // Animasi masuk
    animateIn(appElement);
    
    // Load JS terkait
    const scriptPath = `/js/${componentName}.js`;
    try {
      const module = await import(scriptPath);
      if (module.init) {
        module.init();
      }
    } catch (error) {
      console.log(`No JS module for ${componentName}:`, error);
    }
    
    return true;
  } catch (error) {
    console.error('Error loading component:', error);
    document.getElementById('app').innerHTML = `
      <div class="card">
        <h2 class="text-danger">Error</h2>
        <p>Gagal memuat komponen: ${componentName}</p>
        <button class="btn-solana" onclick="location.reload()">Muat Ulang</button>
      </div>
    `;
    return false;
  }
};

// Generate QR Code
export const generateQR = (elementId, data) => {
  return new QRCode(document.getElementById(elementId), {
    text: data,
    width: 200,
    height: 200,
    colorDark: "#00ffa3",
    colorLight: "transparent",
    correctLevel: QRCode.CorrectLevel.H
  });
};

// Notifikasi
export const showNotification = (message, type = 'success') => {
  const notification = document.createElement('div');
  notification.className = `notification ${type}`;
  notification.innerHTML = `
    <div class="notification-icon">
      ${type === 'success' ? '✓' : '⚠'}
    </div>
    <div class="notification-content">${message}</div>
  `;
  
  document.body.appendChild(notification);
  
  // Animasi masuk
  setTimeout(() => {
    notification.style.transform = 'translateY(0)';
    notification.style.opacity = '1';
  }, 10);
  
  // Hapus setelah 3 detik
  setTimeout(() => {
    notification.style.transform = 'translateY(-100%)';
    notification.style.opacity = '0';
    setTimeout(() => {
      document.body.removeChild(notification);
    }, 300);
  }, 3000);
};

// CSS untuk notifikasi
const notificationStyle = document.createElement('style');
notificationStyle.innerHTML = `
  .notification {
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 1rem;
    border-radius: 12px;
    background: var(--solana-card);
    border: 1px solid rgba(255, 255, 255, 0.1);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
    display: flex;
    align-items: center;
    gap: 1rem;
    z-index: 1000;
    transform: translateY(-100%);
    opacity: 0;
    transition: all 0.3s ease;
  }
  
  .notification.success {
    border-left: 4px solid var(--solana-success);
  }
  
  .notification.error {
    border-left: 4px solid var(--solana-danger);
  }
  
  .notification-icon {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: rgba(0, 255, 163, 0.1);
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: bold;
    color: var(--solana-success);
  }
  
  .notification.error .notification-icon {
    background: rgba(255, 77, 77, 0.1);
    color: var(--solana-danger);
  }
`;
document.head.appendChild(notificationStyle);
