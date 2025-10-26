// Service operations with Firestore
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  query,
  orderBy,
  Timestamp,
} from "firebase/firestore";
import { db } from "./firebase";
import type { Service, InsertService } from "@shared/schema";

const SERVICES_COLLECTION = "services";

export async function getAllServices(): Promise<Service[]> {
  const q = query(collection(db, SERVICES_COLLECTION), orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);
  
  return snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
    } as Service;
  });
}

export async function createService(data: InsertService): Promise<Service> {
  const now = Timestamp.now();
  const serviceData = {
    ...data,
    createdAt: now,
    updatedAt: now,
  };

  const docRef = await addDoc(collection(db, SERVICES_COLLECTION), serviceData);
  
  return {
    id: docRef.id,
    ...data,
    createdAt: now.toDate(),
    updatedAt: now.toDate(),
  };
}

export async function updateService(id: string, data: Partial<InsertService>): Promise<void> {
  const serviceRef = doc(db, SERVICES_COLLECTION, id);
  await updateDoc(serviceRef, {
    ...data,
    updatedAt: Timestamp.now(),
  });
}

export async function deleteService(id: string): Promise<void> {
  const serviceRef = doc(db, SERVICES_COLLECTION, id);
  await deleteDoc(serviceRef);
}
