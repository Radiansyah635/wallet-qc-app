import { db } from './firebaseConfig.js';
import { collection, addDoc, getDocs, doc, setDoc } from 'firebase/firestore';

export const addTransaction = async (transactionData) => {
  try {
    const docRef = await addDoc(collection(db, "transactions"), transactionData);
    return docRef.id;
  } catch (error) {
    console.error("Error adding transaction:", error);
    throw error;
  }
};

export const getTransactions = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, "transactions"));
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("Error getting transactions:", error);
    throw error;
  }
};
