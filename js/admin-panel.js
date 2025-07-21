
        // Konfigurasi Firebase (ganti dengan konfigurasi Anda)
        const firebaseConfig = {
            apiKey: "AIzaSyDummyKey-ChangeWithYourOwn",
            authDomain: "your-project-id.firebaseapp.com",
            projectId: "your-project-id",
            storageBucket: "your-project-id.appspot.com",
            messagingSenderId: "1234567890",
            appId: "1:1234567890:web:abc123def456"
        };
        
        // Inisialisasi Firebase
        firebase.initializeApp(firebaseConfig);
        const db = firebase.firestore();
        
        // DOM Elements
        const form = document.getElementById("transaksiForm");
        const tabs = document.querySelectorAll(".tab");
        const tabContents = document.querySelectorAll(".tab-content");
        const emailSelect = document.getElementById("emailSelect");
        const manualEmailInput = document.getElementById("manualEmail");
        const addEmailBtn = document.getElementById("addEmailBtn");
        const manualEmailsContainer = document.getElementById("manualEmailsContainer");
        const jumlahInput = document.getElementById("jumlah");
        const submitBtn = document.getElementById("submitBtn");
        const submitText = document.getElementById("submitText");
        const submitLoader = document.getElementById("submitLoader");
        const notification = document.getElementById("notification");
        
        // State
        let selectedEmails = [];
        let allUsers = [];
        
        // Load users from Firestore
        function loadUsers() {
            db.collection("users").get().then(snapshot => {
                allUsers = [];
                snapshot.forEach(doc => {
                    const userData = doc.data();
                    allUsers.push({
                        id: doc.id,
                        email: userData.email,
                        saldo: userData.saldo || 0
                    });
                    
                    // Add to dropdown
                    const option = document.createElement("option");
                    option.value = doc.id;
                    option.textContent = userData.email;
                    emailSelect.appendChild(option);
                });
            }).catch(error => {
                showNotification("Gagal memuat data pengguna: " + error.message, "error");
            });
        }
        
        // Tab Switching
        tabs.forEach(tab => {
            tab.addEventListener("click", () => {
                // Remove active class from all tabs
                tabs.forEach(t => t.classList.remove("active"));
                tabContents.forEach(c => c.classList.remove("active"));
                
                // Add active class to clicked tab
                tab.classList.add("active");
                document.getElementById(tab.dataset.tab + "Tab").classList.add("active");
            });
        });
        
        // Add email manually
        addEmailBtn.addEventListener("click", () => {
            const email = manualEmailInput.value.trim();
            
            if (!email) {
                showNotification("Email tidak boleh kosong", "error");
                return;
            }
            
            if (!validateEmail(email)) {
                showNotification("Format email tidak valid", "error");
                return;
            }
            
            if (selectedEmails.includes(email)) {
                showNotification("Email sudah ditambahkan", "error");
                return;
            }
            
            selectedEmails.push(email);
            renderSelectedEmails();
            manualEmailInput.value = "";
        });
        
        // Remove email
        function removeEmail(email) {
            selectedEmails = selectedEmails.filter(e => e !== email);
            renderSelectedEmails();
        }
        
        // Render selected emails
        function renderSelectedEmails() {
            manualEmailsContainer.innerHTML = "";
            
            if (selectedEmails.length === 0) {
                manualEmailsContainer.innerHTML = '<div class="empty-state">Belum ada email yang ditambahkan</div>';
                return;
            }
            
            selectedEmails.forEach(email => {
                const tag = document.createElement("div");
                tag.className = "email-tag";
                tag.innerHTML = `
                    ${email}
                    <button type="button" onclick="removeEmail('${email}')">×</button>
                `;
                manualEmailsContainer.appendChild(tag);
            });
        }
        
        // Email validation
        function validateEmail(email) {
            const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            return re.test(email);
        }
        
        // Show notification
        function showNotification(message, type = "success") {
            notification.textContent = message;
            notification.className = `notification ${type}`;
            notification.classList.add("show");
            
            setTimeout(() => {
                notification.classList.remove("show");
            }, 3000);
        }
        
        // Form submission
        form.addEventListener("submit", async (e) => {
            e.preventDefault();
            
            const activeTab = document.querySelector(".tab.active").dataset.tab;
            const jenis = document.querySelector('input[name="jenis"]:checked').value;
            const jumlah = parseFloat(jumlahInput.value);
            const keterangan = document.getElementById("keterangan").value;
            
            // Validation
            if (isNaN(jumlah) || jumlah <= 0) {
                showNotification("Jumlah harus angka positif", "error");
                return;
            }
            
            // Determine selected users based on active tab
            let usersToUpdate = [];
            
            switch(activeTab) {
                case "manual":
                    if (selectedEmails.length === 0) {
                        showNotification("Tambahkan minimal satu email", "error");
                        return;
                    }
                    usersToUpdate = selectedEmails.map(email => ({ email }));
                    break;
                    
                case "dropdown":
                    const selectedId = emailSelect.value;
                    if (!selectedId) {
                        showNotification("Pilih email dari daftar", "error");
                        return;
                    }
                    const selectedUser = allUsers.find(u => u.id === selectedId);
                    if (selectedUser) {
                        usersToUpdate = [selectedUser];
                    }
                    break;
                    
                case "all":
                    usersToUpdate = allUsers;
                    break;
            }
            
            if (usersToUpdate.length === 0) {
                showNotification("Tidak ada pengguna yang dipilih", "error");
                return;
            }
            
            // Show loader
            submitText.textContent = "Memproses...";
            submitLoader.style.display = "inline-block";
            submitBtn.disabled = true;
            
            try {
                // Update saldo for all selected users
                const batch = db.batch();
                const updatedUsers = [];
                
                for (const user of usersToUpdate) {
                    const userRef = db.collection("users").doc(user.id || user.email);
                    const saldo = user.saldo || 0;
                    const newSaldo = jenis === "masuk" ? saldo + jumlah : saldo - jumlah;
                    
                    // Validate saldo
                    if (newSaldo < 0) {
                        throw new Error(`Saldo tidak mencukupi untuk ${user.email}`);
                    }
                    
                    batch.update(userRef, { saldo: newSaldo });
                    updatedUsers.push(user.email);
                }
                
                // Commit batch update
                await batch.commit();
                
                // Add transaction record
                const transactionData = {
                    jenis,
                    jumlah,
                    keterangan: keterangan || "Transaksi saldo",
                    users: updatedUsers,
                    timestamp: firebase.firestore.FieldValue.serverTimestamp()
                };
                
                await db.collection("transactions").add(transactionData);
                
                // Show success message
                let message;
                if (activeTab === "all") {
                    message = `Berhasil memperbarui saldo ${allUsers.length} pengguna!`;
                } else {
                    message = `Berhasil memperbarui saldo ${updatedUsers.length} pengguna!`;
                }
                
                showNotification(message, "success");
                
                // Reset form
                form.reset();
                selectedEmails = [];
                renderSelectedEmails();
                
            } catch (error) {
                console.error("Error:", error);
                showNotification(`Gagal: ${error.message}`, "error");
            } finally {
                // Hide loader
                submitText.textContent = "Proses Transaksi";
                submitLoader.style.display = "none";
                submitBtn.disabled = false;
            }
        });
        
        // Initialize
        loadUsers();
    
