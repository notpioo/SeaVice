import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  getDocs, 
  query, 
  where,
  orderBy,
  Timestamp,
  getDoc,
  DocumentData
} from "firebase/firestore";
import { db } from "./firebase";
import type { Order, InsertOrder, UpdateOrder, OrderStatus } from "@shared/schema";

const ORDERS_COLLECTION = "orders";

function mapDocToOrder(id: string, data: DocumentData): Order {
  return {
    id,
    userId: data.userId,
    serviceId: data.serviceId,
    serviceName: data.serviceName,
    originalPrice: data.originalPrice,
    servicePrice: data.servicePrice,
    voucherCode: data.voucherCode,
    discountAmount: data.discountAmount,
    finalPrice: data.finalPrice,
    status: data.status,
    notes: data.notes,
    orderDate: data.orderDate?.toDate(),
    deliveryDate: data.deliveryDate?.toDate(),
    createdAt: data.createdAt?.toDate(),
    updatedAt: data.updatedAt?.toDate(),
  };
}

export async function createOrder(orderData: InsertOrder): Promise<Order> {
  try {
    const now = new Date();
    const deliveryDate = orderData.deliveryDate ? new Date(orderData.deliveryDate) : null;
    
    const docRef = await addDoc(collection(db, ORDERS_COLLECTION), {
      ...orderData,
      orderDate: Timestamp.fromDate(now),
      deliveryDate: deliveryDate ? Timestamp.fromDate(deliveryDate) : null,
      createdAt: Timestamp.fromDate(now),
      updatedAt: Timestamp.fromDate(now),
    });

    const newDoc = await getDoc(docRef);
    const data = newDoc.data();
    
    if (!data) {
      throw new Error("Gagal mengambil data pesanan yang baru dibuat");
    }
    
    return mapDocToOrder(newDoc.id, data);
  } catch (error) {
    console.error("Error creating order:", error);
    throw new Error("Gagal membuat pesanan");
  }
}

export async function getAllOrders(): Promise<Order[]> {
  try {
    const q = query(collection(db, ORDERS_COLLECTION), orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => mapDocToOrder(doc.id, doc.data()));
  } catch (error) {
    console.error("Error getting orders:", error);
    throw new Error("Gagal mengambil data pesanan");
  }
}

export async function getUserOrders(userId: string): Promise<Order[]> {
  try {
    console.log("getUserOrders called with userId:", userId); // Debug log
    const q = query(
      collection(db, ORDERS_COLLECTION), 
      where("userId", "==", userId)
    );
    const querySnapshot = await getDocs(q);
    
    console.log("Query snapshot size:", querySnapshot.size); // Debug log
    const orders = querySnapshot.docs.map(doc => {
      console.log("Order doc:", doc.id, doc.data()); // Debug log
      return mapDocToOrder(doc.id, doc.data());
    });
    
    // Sort by createdAt descending on client-side
    return orders.sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateB - dateA;
    });
  } catch (error) {
    console.error("Error getting user orders:", error);
    throw new Error("Gagal mengambil data pesanan user");
  }
}

export async function getOrderById(orderId: string): Promise<Order | null> {
  try {
    const docRef = doc(db, ORDERS_COLLECTION, orderId);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      return null;
    }
    
    return mapDocToOrder(docSnap.id, docSnap.data());
  } catch (error) {
    console.error("Error getting order:", error);
    throw new Error("Gagal mengambil data pesanan");
  }
}

export async function updateOrder(orderId: string, updates: UpdateOrder): Promise<void> {
  try {
    const docRef = doc(db, ORDERS_COLLECTION, orderId);
    const updateData: any = {
      ...updates,
      updatedAt: Timestamp.fromDate(new Date()),
    };
    
    if (updates.deliveryDate) {
      updateData.deliveryDate = Timestamp.fromDate(new Date(updates.deliveryDate));
    }
    
    await updateDoc(docRef, updateData);
  } catch (error) {
    console.error("Error updating order:", error);
    throw new Error("Gagal mengupdate pesanan");
  }
}

export async function deleteOrder(orderId: string): Promise<void> {
  try {
    const docRef = doc(db, ORDERS_COLLECTION, orderId);
    await deleteDoc(docRef);
  } catch (error) {
    console.error("Error deleting order:", error);
    throw new Error("Gagal menghapus pesanan");
  }
}

export async function getOrdersByStatus(status: OrderStatus): Promise<Order[]> {
  try {
    const q = query(
      collection(db, ORDERS_COLLECTION),
      where("status", "==", status),
      orderBy("createdAt", "desc")
    );
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => mapDocToOrder(doc.id, doc.data()));
  } catch (error) {
    console.error("Error getting orders by status:", error);
    throw new Error("Gagal mengambil data pesanan berdasarkan status");
  }
}
