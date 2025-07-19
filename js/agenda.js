// agenda.js
import { db, auth, storage } from './firebase-config.js';
import { formatDate, showNotification } from './utils.js';

export function initAgenda() {
  // Periksa apakah user admin
  checkAdminRole();
  
  // Load agenda
  loadAgendas();
  
  // Setup form agenda
  setupAgendaForm();
}

function checkAdminRole() {
  const user = auth.currentUser;
  if (!user) return;
  
  db.collection('users').doc(user.uid).get()
    .then(doc => {
      if (doc.exists && doc.data().role === 'admin') {
        document.getElementById('btn-new-container').style.display = 'block';
        
        // Event listener untuk tombol baru
        document.getElementById('btn-new-agenda').addEventListener('click', () => {
          document.getElementById('agenda-form-container').style.display = 'block';
          document.getElementById('agenda-form').reset();
          document.getElementById('form-agenda-title').textContent = 'Buat Agenda Baru';
          document.getElementById('agenda-id').value = '';
          document.getElementById('lampiran-preview').innerHTML = '';
        });
        
        // Event listener untuk tombol batal
        document.getElementById('btn-cancel-form').addEventListener('click', () => {
          document.getElementById('agenda-form-container').style.display = 'none';
        });
      }
    });
}

function loadAgendas() {
  const container = document.getElementById('daftar-agenda');
  container.innerHTML = '<div class="card"><p>Memuat agenda...</p></div>';
  
  const now = new Date();
  
  db.collection('agenda')
    .orderBy('tanggal', 'asc')
    .onSnapshot(snapshot => {
      container.innerHTML = '';
      
      if (snapshot.empty) {
        container.innerHTML = '<div class="card"><p>Tidak ada agenda</p></div>';
        return;
      }
      
      snapshot.forEach(doc => {
        const agenda = doc.data();
        const date = agenda.tanggal.toDate();
        const isPast = date < now;
        
        const card = document.createElement('div');
        card.className = `card agenda-card ${isPast ? 'past' : ''}`;
        
        card.innerHTML = `
          <div class="agenda-badge">${agenda.kategori || 'Umum'}</div>
          <div class="agenda-date">${date.getDate()} ${date.toLocaleString('id-ID', { month: 'short' }).toUpperCase()}</div>
          <div class="agenda-content">
            <h3 class="agenda-title">${agenda.judul}</h3>
            <p>${agenda.deskripsi}</p>
            <div class="agenda-meta">
              <div class="agenda-time">⏰ ${date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</div>
              <div class="agenda-location">📍 ${agenda.lokasi || 'Online'}</div>
            </div>
            ${agenda.lampiran ? `
            <div class="agenda-attachment">
              <a href="${agenda.lampiran.url}" target="_blank" class="btn-secondary">
                <i class="btn-icon">📎</i> ${agenda.lampiran.name}
              </a>
            </div>
            ` : ''}
          </div>
        `;
        
        // Tambahkan tombol edit untuk admin
        if (document.getElementById('btn-new-container').style.display === 'block') {
          const actions = document.createElement('div');
          actions.className = 'agenda-actions';
          actions.innerHTML = `
            <button class="btn-secondary btn-edit" data-id="${doc.id}">✏️ Edit</button>
            <button class="btn-danger btn-delete" data-id="${doc.id}">🗑️ Hapus</button>
          `;
          card.querySelector('.agenda-content').appendChild(actions);
          
          // Event listener untuk edit
          card.querySelector('.btn-edit').addEventListener('click', (e) => {
            const agendaId = e.target.dataset.id;
            editAgenda(agendaId);
          });
          
          // Event listener untuk hapus
          card.querySelector('.btn-delete').addEventListener('click', (e) => {
            const agendaId = e.target.dataset.id;
            deleteAgenda(agendaId);
          });
        }
        
        container.appendChild(card);
      });
    });
}

function setupAgendaForm() {
  const form = document.getElementById('agenda-form');
  if (!form) return;
  
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const agendaId = document.getElementById('agenda-id').value;
    const judul = document.getElementById('agenda-judul').value;
    const deskripsi = document.getElementById('agenda-deskripsi').value;
    const tanggal = new Date(document.getElementById('agenda-tanggal').value);
    const lokasi = document.getElementById('agenda-lokasi').value;
    const kategori = document.getElementById('agenda-kategori').value;
    const lampiranFile = document.getElementById('agenda-lampiran').files[0];
    
    const agendaData = {
      judul,
      deskripsi,
      tanggal,
      lokasi,
      kategori,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    // Handle lampiran file
    if (lampiranFile) {
      const storageRef = storage.ref(`agenda_lampiran/${Date.now()}_${lampiranFile.name}`);
      const uploadTask = storageRef.put(lampiranFile);
      
      uploadTask.on('state_changed',
        null,
        error => showNotification(`Upload lampiran gagal: ${error.message}`, 'error'),
        async () => {
          const downloadURL = await uploadTask.snapshot.ref.getDownloadURL();
          agendaData.lampiran = {
            name: lampiranFile.name,
            url: downloadURL
          };
          saveAgenda(agendaId, agendaData);
        }
      );
    } else {
      saveAgenda(agendaId, agendaData);
    }
  });
}

function saveAgenda(agendaId, data) {
  if (agendaId) {
    // Update existing agenda
    db.collection('agenda').doc(agendaId).update(data)
      .then(() => {
        showNotification('Agenda berhasil diperbarui!', 'success');
        document.getElementById('agenda-form-container').style.display = 'none';
      });
  } else {
    // Create new agenda
    db.collection('agenda').add(data)
      .then(() => {
        showNotification('Agenda baru berhasil dibuat!', 'success');
        document.getElementById('agenda-form').reset();
      });
  }
}

function editAgenda(agendaId) {
  db.collection('agenda').doc(agendaId).get()
    .then(doc => {
      if (doc.exists) {
        const agenda = doc.data();
        
        // Isi form dengan data agenda
        document.getElementById('agenda-id').value = doc.id;
        document.getElementById('agenda-judul').value = agenda.judul;
        document.getElementById('agenda-deskripsi').value = agenda.deskripsi;
        document.getElementById('agenda-tanggal').value = formatDateTimeLocal(agenda.tanggal.toDate());
        document.getElementById('agenda-lokasi').value = agenda.lokasi || '';
        document.getElementById('agenda-kategori').value = agenda.kategori || 'rapat';
        
        // Tampilkan lampiran jika ada
        const preview = document.getElementById('lampiran-preview');
        preview.innerHTML = '';
        if (agenda.lampiran) {
          preview.innerHTML = `
            <p>Lampiran saat ini:</p>
            <a href="${agenda.lampiran.url}" target="_blank">${agenda.lampiran.name}</a>
            <label class="form-label" style="margin-top: 1rem;">
              <input type="checkbox" id="replace-lampiran"> Ganti lampiran
            </label>
          `;
        }
        
        // Tampilkan form
        document.getElementById('agenda-form-container').style.display = 'block';
        document.getElementById('form-agenda-title').textContent = 'Edit Agenda';
      }
    });
}

function deleteAgenda(agendaId) {
  if (confirm('Apakah Anda yakin ingin menghapus agenda ini?')) {
    db.collection('agenda').doc(agendaId).delete()
      .then(() => {
        showNotification('Agenda berhasil dihapus', 'success');
      });
  }
}

function formatDateTimeLocal(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}