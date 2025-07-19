// auth.js
export const loginUser = (email, password) => {
  return firebase.auth().signInWithEmailAndPassword(email, password);
};

export const registerUser = async (email, password, name) => {
  try {
    const userCredential = await firebase.auth().createUserWithEmailAndPassword(email, password);
    
    // Simpan data tambahan user di Firestore
    await firebase.firestore().collection('users').doc(userCredential.user.uid).set({
      email,
      nama: name,
      saldo: 0,
      role: "user",
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    
    return userCredential;
  } catch (error) {
    throw error;
  }
};

export const logoutUser = () => {
  return firebase.auth().signOut();
};