const form = document.getElementById("transaksiForm");
const emailSelect = document.getElementById("email");

// Ambil user dari Firestore untuk diisi ke dalam dropdown
firebase.firestore().collection("users").get().then(snapshot => {
  snapshot.forEach(doc => {
    const option = document.createElement("option");
    option.value = doc.id;
    option.textContent = doc.data().email;
    emailSelect.appendChild(option);
  });
});

// Submit form
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const selectedEmail = emailSelect.value;
  const jenis = form.jenis.value;
  const jumlah = parseFloat(form.jumlah.value);
  const usersRef = firebase.firestore().collection("users");

  if (selectedEmail === "all") {
    // Update semua user
    const snapshot = await usersRef.get();
    snapshot.forEach(async doc => {
      const saldo = doc.data().saldo || 0;
      const newSaldo = jenis === "masuk" ? saldo + jumlah : saldo - jumlah;
      await usersRef.doc(doc.id).update({ saldo: newSaldo });
    });
    alert("Saldo semua user telah diperbarui.");
  } else {
    // Update satu user
    const userDoc = await usersRef.doc(selectedEmail).get();
    const saldo = userDoc.data().saldo || 0;
    const newSaldo = jenis === "masuk" ? saldo + jumlah : saldo - jumlah;
    await usersRef.doc(selectedEmail).update({ saldo: newSaldo });
    alert("Saldo user diperbarui.");
  }

  form.reset();
});
