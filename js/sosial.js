// sosial.js
import { db, auth, storage } from './firebase-config.js';
import { formatDate, showNotification } from './utils.js';

export function initSosial() {
  // Load postingan
  loadPosts();
  
  // Setup form posting
  setupPostForm();
}

function loadPosts() {
  const feed = document.getElementById('post-feed');
  feed.innerHTML = '<div class="card"><p>Memuat postingan...</p></div>';
  
  db.collection('posts')
    .orderBy('timestamp', 'desc')
    .onSnapshot(snapshot => {
      feed.innerHTML = '';
      
      if (snapshot.empty) {
        feed.innerHTML = '<div class="card"><p>Belum ada postingan</p></div>';
        return;
      }
      
      snapshot.forEach(doc => {
        const post = doc.data();
        const postCard = document.createElement('div');
        postCard.className = 'post-card card';
        
        postCard.innerHTML = `
          <div class="post-header">
            <img src="${post.userAvatar || 'https://i.pravatar.cc/150?img=3'}" 
                 alt="${post.userName}" class="post-avatar">
            <div>
              <div class="post-author">${post.userName}</div>
              <div class="post-time">${formatDate(post.timestamp.toDate())}</div>
            </div>
            ${isCurrentUser(post.userId) || isAdmin() ? `
            <div class="post-actions-menu">
              <button class="btn-edit-post" data-id="${doc.id}">✏️</button>
              <button class="btn-delete-post" data-id="${doc.id}">🗑️</button>
            </div>
            ` : ''}
          </div>
          
          <div class="post-content">${post.content}</div>
          
          ${post.media ? `
          <div class="post-media">
            ${post.media.type.startsWith('image') ? `
              <img src="${post.media.url}" alt="Media post" class="post-image">
            ` : post.media.type.startsWith('video') ? `
              <video controls class="post-video">
                <source src="${post.media.url}" type="${post.media.type}">
              </video>
            ` : ''}
          </div>
          ` : ''}
          
          <div class="post-actions">
            <div class="post-action">
              <i class="action-icon">👍</i> <span>15</span>
            </div>
            <div class="post-action">
              <i class="action-icon">💬</i> <span>3</span>
            </div>
            <div class="post-action">
              <i class="action-icon">↗️</i> <span>Bagikan</span>
            </div>
          </div>
        `;
        
        // Tambahkan event listener untuk edit/hapus
        if (isCurrentUser(post.userId) || isAdmin()) {
          postCard.querySelector('.btn-edit-post').addEventListener('click', (e) => {
            editPost(doc.id, post);
          });
          
          postCard.querySelector('.btn-delete-post').addEventListener('click', (e) => {
            deletePost(doc.id);
          });
        }
        
        feed.appendChild(postCard);
      });
    });
}

function setupPostForm() {
  const form = document.getElementById('post-form');
  const mediaInput = document.getElementById('post-media');
  const mediaPreview = document.getElementById('media-preview');
  
  mediaInput.addEventListener('change', (e) => {
    mediaPreview.innerHTML = '';
    const file = e.target.files[0];
    if (!file) return;
    
    if (file.type.startsWith('image')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        mediaPreview.innerHTML = `<img src="${event.target.result}" alt="Preview" class="media-preview-image">`;
      };
      reader.readAsDataURL(file);
    } else if (file.type.startsWith('video')) {
      const video = document.createElement('video');
      video.src = URL.createObjectURL(file);
      video.controls = true;
      video.className = 'media-preview-video';
      mediaPreview.appendChild(video);
    }
  });
  
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const user = auth.currentUser;
    if (!user) return;
    
    const content = document.getElementById('post-content').value;
    const mediaFile = document.getElementById('post-media').files[0];
    
    if (!content && !mediaFile) {
      showNotification('Postingan tidak boleh kosong', 'error');
      return;
    }
    
    const postData = {
      userId: user.uid,
      userName: user.displayName || 'User',
      userAvatar: user.photoURL || '',
      content,
      timestamp: new Date(),
      likes: [],
      comments: []
    };
    
    // Upload media jika ada
    if (mediaFile) {
      const storageRef = storage.ref(`post_media/${Date.now()}_${mediaFile.name}`);
      const uploadTask = storageRef.put(mediaFile);
      
      uploadTask.on('state_changed',
        null,
        error => showNotification(`Upload media gagal: ${error.message}`, 'error'),
        async () => {
          const downloadURL = await uploadTask.snapshot.ref.getDownloadURL();
          postData.media = {
            url: downloadURL,
            type: mediaFile.type,
            name: mediaFile.name
          };
          savePost(postData);
        }
      );
    } else {
      savePost(postData);
    }
  });
}

function savePost(postData) {
  db.collection('posts').add(postData)
    .then(() => {
      showNotification('Postingan berhasil dibuat!', 'success');
      document.getElementById('post-form').reset();
      document.getElementById('media-preview').innerHTML = '';
    })
    .catch(error => {
      showNotification(`Gagal membuat postingan: ${error.message}`, 'error');
    });
}

function editPost(postId, postData) {
  // Implementasi edit postingan
  showNotification('Fitur edit postingan belum diimplementasi', 'warning');
}

function deletePost(postId) {
  if (confirm('Apakah Anda yakin ingin menghapus postingan ini?')) {
    db.collection('posts').doc(postId).delete()
      .then(() => {
        showNotification('Postingan berhasil dihapus', 'success');
      });
  }
}

function isCurrentUser(userId) {
  return auth.currentUser && auth.currentUser.uid === userId;
}

async function isAdmin() {
  if (!auth.currentUser) return false;
  const userDoc = await db.collection('users').doc(auth.currentUser.uid).get();
  return userDoc.exists && userDoc.data().role === 'admin';
}