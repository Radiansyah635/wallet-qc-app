import { 
  loginUser, 
  logoutUser, 
  checkAuthState, 
  getUserRole 
} from './firebase-config.js';

// Sistem Manajemen Auth
class AuthSystem {
  constructor() {
    this.currentUser = null;
    this.userRole = null;
    this.initAuthListener();
  }

  async initAuthListener() {
    checkAuthState(async (user) => {
      if (user) {
        this.currentUser = user;
        this.userRole = await getUserRole(user.uid);
        this.handleRedirect();
      } else {
        this.currentUser = null;
        this.userRole = null;
        if (!window.location.pathname.includes('login.html')) {
          window.location.href = 'login.html';
        }
      }
    });
  }

  handleRedirect() {
    const currentPage = window.location.pathname.split('/').pop();
    
    // Jika sudah di halaman yang benar, tidak perlu redirect
    if (
      (this.userRole === 'admin' && currentPage === 'admin-dashboard.html') ||
      (this.userRole === 'user' && currentPage === 'user-dashboard.html')
    ) {
      return;
    }
    
    // Redirect berdasarkan role
    if (this.userRole === 'admin') {
      window.location.href = 'admin-dashboard.html';
    } else {
      window.location.href = 'user-dashboard.html';
    }
  }

  async login(email, password) {
    const result = await loginUser(email, password);
    if (!result.success) {
      throw new Error(result.error);
    }
    return result.user;
  }

  async logout() {
    await logoutUser();
    window.location.href = 'login.html';
  }
}

export const authSystem = new AuthSystem();
