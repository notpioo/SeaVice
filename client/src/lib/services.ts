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
  where,
  Timestamp,
} from "firebase/firestore";
import { db } from "./firebase";
import type { Service, InsertService } from "@shared/schema";

const SERVICES_COLLECTION = "services";
const ORDERS_COLLECTION = "orders";

export async function getAllServices(): Promise<Service[]> {
  console.log('📥 [Firestore] Fetching all services...');
  const q = query(collection(db, SERVICES_COLLECTION), orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);
  
  // Get all orders to calculate order counts per service
  const ordersSnapshot = await getDocs(collection(db, ORDERS_COLLECTION));
  const orderCountMap: Record<string, number> = {};
  
  ordersSnapshot.docs.forEach((orderDoc) => {
    const orderData = orderDoc.data();
    const serviceId = orderData.serviceId;
    if (serviceId) {
      orderCountMap[serviceId] = (orderCountMap[serviceId] || 0) + 1;
    }
  });
  
  const services = snapshot.docs.map((doc) => {
    const data = doc.data();
    const orderCount = orderCountMap[doc.id] || 0;
    const service = {
      id: doc.id,
      ...data,
      orderCount: orderCount,
      rating: orderCount > 0 ? (data.rating || 5.0) : 0.0,
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
    } as Service;
    
    console.log(`📦 [Service ${doc.id}] imageUrl:`, service.imageUrl);
    return service;
  });
  
  console.log('✅ [Firestore] Fetched', services.length, 'services');
  return services;
}

export async function createService(data: InsertService): Promise<Service> {
  const now = Timestamp.now();
  const serviceData = {
    ...data,
    orderCount: 0,
    rating: 0.0,
    createdAt: now,
    updatedAt: now,
  };

  const docRef = await addDoc(collection(db, SERVICES_COLLECTION), serviceData);
  
  return {
    id: docRef.id,
    ...data,
    orderCount: 0,
    rating: 0.0,
    createdAt: now.toDate(),
    updatedAt: now.toDate(),
  };
}

export async function updateService(id: string, data: Partial<InsertService>): Promise<void> {
  console.log('🔄 [Firestore] Updating service ID:', id);
  console.log('🔄 [Firestore] Update data:', data);
  const serviceRef = doc(db, SERVICES_COLLECTION, id);
  const updateData = {
    ...data,
    updatedAt: Timestamp.now(),
  };
  console.log('🔄 [Firestore] Final update payload:', updateData);
  await updateDoc(serviceRef, updateData);
  console.log('✅ [Firestore] Service updated successfully');
}

export async function deleteService(id: string): Promise<void> {
  const serviceRef = doc(db, SERVICES_COLLECTION, id);
  await deleteDoc(serviceRef);
}
