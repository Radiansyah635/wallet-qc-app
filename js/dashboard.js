// Import Firebase
import { getAuth, signOut } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";
import { getFirestore, doc, getDoc, collection, addDoc, onSnapshot, query, orderBy } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";
import { app } from "./js/firebase-config.js";

// Initialize Firebase
const auth = getAuth(app);
const db = getFirestore(app);

// DOM Elements
const usernameDisplay = document.getElementById('usernameDisplay');
const userEmail = document.getElementById('userEmail');
const userRoleBadge = document.getElementById('userRoleBadge');
const userAvatar = document.getElementById('userAvatar');
const logoutBtn = document.getElementById('logoutBtn');
const menuItems = document.querySelectorAll('.main-menu li');
const contentSections = document.querySelectorAll('.content-section');
const contentTitle = document.getElementById('contentTitle');

// Agenda Elements
const addAgendaBtn = document.getElementById('addAgendaBtn');
const agendaModal = document.getElementById('agendaModal');
const closeModal = document.querySelector('.close-modal');
const agendaForm = document.getElementById('agendaForm');
const agendaList = document.querySelector('.agenda-list');

// Chart Elements
const transactionChart = document.getElementById('transactionChart');

// Load User Data
async function loadUserData() {
  const user = auth.currentUser;
  
  if (user) {
    // Set basic info from auth
    userEmail.textContent = user.email;
    
    // Get additional info from Firestore
    const userDoc = await getDoc(doc(db, "users", user.uid));
    
    if (userDoc.exists()) {
      const userData = userDoc.data();
      usernameDisplay.textContent = userData.username || 'User';
      
      // Set role badge
      if (userData.role === 'admin') {
        userRoleBadge.textContent = 'Admin';
        userRoleBadge.style.backgroundColor = var(--solana-purple);
        
        // Show admin-specific elements
        document.getElementById('newTransactionBtn').style.display = 'flex';
      } else {
        userRoleBadge.textContent = 'User';
        userRoleBadge.style.backgroundColor = var(--solana-blue);
        
        // Hide admin-specific elements
        document.getElementById('newTransactionBtn').style.display = 'none';
      }
      
      // Set avatar if exists
      if (userData.photoURL) {
        userAvatar.src = userData.photoURL;
      }
    }
  }
}

// Navigation Control
function setupNavigation() {
  menuItems.forEach(item => {
    item.addEventListener('click', function() {
      // Remove active class from all items
      menuItems.forEach(i => i.classList.remove('active'));
      
      // Add active class to clicked item
      this.classList.add('active');
      
      // Get content to show
      const contentToShow = this.getAttribute('data-content');
      
      // Hide all content sections
      contentSections.forEach(section => {
        section.style.display = 'none';
      });
      
      // Show selected content
      document.getElementById(`${contentToShow}Content`).style.display = 'block';
      
      // Update content title
      contentTitle.textContent = this.querySelector('span').textContent;
      
      // Load specific content if needed
      if (contentToShow === 'agenda') {
        loadAgenda();
      } else if (contentToShow === 'analytics') {
        initChart();
      }
    });
  });
}

// Agenda Functions
function setupAgenda() {
  // Open modal
  addAgendaBtn.addEventListener('click', () => {
    agendaModal.style.display = 'flex';
  });
  
  // Close modal
  closeModal.addEventListener('click', () => {
    agendaModal.style.display = 'none';
  });
  
  // Submit form
  agendaForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const title = document.getElementById('agendaTitle').value;
    const date = document.getElementById('agendaDate').value;
    const desc = document.getElementById('agendaDesc').value;
    const file = document.getElementById('agendaFile').files[0];
    
    try {
      // Here you would upload the file to storage if needed
      // Then save agenda data to Firestore
      await addDoc(collection(db, "agenda"), {
        title,
        date,
        description: desc,
        createdAt: new Date(),
        createdBy: auth.currentUser.uid
      });
      
      // Close modal and reset form
      agendaModal.style.display = 'none';
      agendaForm.reset();
      
      // Reload agenda
      loadAgenda();
    } catch (error) {
      console.error("Error adding agenda:", error);
    }
  });
}

async function loadAgenda() {
  // Clear existing agenda
  agendaList.innerHTML = '';
  
  // Create query
  const q = query(collection(db, "agenda"), orderBy("date", "desc"));
  
  // Set up real-time listener
  onSnapshot(q, (snapshot) => {
    snapshot.docChanges().forEach(change => {
      if (change.type === "added") {
        const agenda = change.doc.data();
        const agendaItem = document.createElement('div');
        agendaItem.className = 'agenda-item';
        agendaItem.innerHTML = `
          <div>
            <h3>${agenda.title}</h3>
            <p>${agenda.description}</p>
            <p class="agenda-date">${new Date(agenda.date).toLocaleDateString()}</p>
          </div>
          <div class="agenda-actions">
            <button><i class="fas fa-edit"></i></button>
            <button><i class="fas fa-trash"></i></button>
          </div>
        `;
        agendaList.appendChild(agendaItem);
      }
    });
  });
}

// Chart Functions
function initChart() {
  const ctx = transactionChart.getContext('2d');
  
  // Sample data - replace with real data from Firestore
  const data = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [{
      label: 'Transaksi Masuk',
      data: [1200000, 1900000, 3000000, 2500000, 2200000, 3500000],
      backgroundColor: 'rgba(153, 69, 255, 0.2)',
      borderColor: 'rgba(153, 69, 255, 1)',
      borderWidth: 2,
      tension: 0.4
    }, {
      label: 'Transaksi Keluar',
      data: [800000, 1200000, 1500000, 1000000, 1800000, 1200000],
      backgroundColor: 'rgba(20, 241, 149, 0.2)',
      borderColor: 'rgba(20, 241, 149, 1)',
      borderWidth: 2,
      tension: 0.4
    }]
  };
  
  const config = {
    type: 'line',
    data: data,
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: 'top',
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              return context.dataset.label + ': Rp' + context.raw.toLocaleString();
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: function(value) {
              return 'Rp' + value.toLocaleString();
            }
          }
        }
      }
    }
  };
  
  new Chart(ctx, config);
}

// Logout Function
function setupLogout() {
  logoutBtn.addEventListener('click', async () => {
    try {
      await signOut(auth);
      window.location.href = 'index.html';
    } catch (error) {
      console.error("Logout error:", error);
    }
  });
}

// Initialize Dashboard
document.addEventListener('DOMContentLoaded', async () => {
  await loadUserData();
  setupNavigation();
  setupAgenda();
  setupLogout();
  
  // Load default content (agenda)
  document.querySelector('.main-menu li.active').click();
});
