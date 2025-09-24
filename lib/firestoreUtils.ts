// lib/firestoreUtils.ts
import { getDocs } from 'firebase/firestore';

export const getDoc = async (query: any) => {
  try {
    const snapshot = await getDocs(query);
    return snapshot;
  } catch (error) {
    console.error('Error getting documents:', error);
    throw error;
  }
};