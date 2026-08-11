import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  doc, 
  getDocs, 
  setDoc, 
  deleteDoc, 
  onSnapshot, 
  query, 
  orderBy,
  serverTimestamp
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { Demand } from '../types';

// Initialize Firebase App
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Initialize Firestore with specific databaseId if provided
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId || undefined);

const DEMANDS_COLLECTION = 'demands';

// Real-time listener for demands
export function subscribeToDemands(onUpdate: (demands: Demand[]) => void, onError?: (err: any) => void) {
  try {
    const q = query(collection(db, DEMANDS_COLLECTION));
    return onSnapshot(q, (snapshot) => {
      const demands: Demand[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        demands.push({
          ...data,
          id: docSnap.id
        } as Demand);
      });
      
      // Sort by createdAt descending
      demands.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      onUpdate(demands);
    }, (err) => {
      console.error('Erro na subscrição do Firestore:', err);
      if (onError) onError(err);
    });
  } catch (err) {
    console.error('Erro ao inicializar listener do Firestore:', err);
    if (onError) onError(err);
    return () => {};
  }
}

// Save or Update a Demand in Firestore
export async function saveDemandToFirestore(demand: Demand): Promise<void> {
  try {
    const demandRef = doc(db, DEMANDS_COLLECTION, demand.id);
    await setDoc(demandRef, {
      ...demand,
      updatedAt: new Date().toISOString()
    }, { merge: true });
  } catch (err) {
    console.error('Erro ao salvar demanda no Firestore:', err);
    throw err;
  }
}

// Batch save multiple demands to Firestore
export async function saveMultipleDemandsToFirestore(demands: Demand[]): Promise<void> {
  try {
    await Promise.all(demands.map(d => saveDemandToFirestore(d)));
  } catch (err) {
    console.error('Erro ao salvar lote no Firestore:', err);
    throw err;
  }
}

// Delete a Demand from Firestore
export async function deleteDemandFromFirestore(demandId: string): Promise<void> {
  try {
    const demandRef = doc(db, DEMANDS_COLLECTION, demandId);
    await deleteDoc(demandRef);
  } catch (err) {
    console.error('Erro ao excluir demanda do Firestore:', err);
    throw err;
  }
}
