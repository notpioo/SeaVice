import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
  Timestamp,
  onSnapshot,
  DocumentData
} from "firebase/firestore";
import { db } from "./firebase";
import { updateServiceRating } from "./services";
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
    paymentStatus: data.paymentStatus,
    paymentProofUrl: data.paymentProofUrl,
    uploadAttempts: data.uploadAttempts || 0,
    notes: data.notes,
    rating: data.rating, // Added rating field
    review: data.review, // Added review field
    orderDate: data.orderDate?.toDate(),
    deliveryDate: data.deliveryDate?.toDate(),
    createdAt: data.createdAt?.toDate(),
    updatedAt: data.updatedAt?.toDate(),
  };
}

export async function createOrder(orderData: InsertOrder): Promise<Order> {
  try {
    console.log("📝 Creating order in Firestore:", orderData);

    const now = new Date();
    const deliveryDate = orderData.deliveryDate ? new Date(orderData.deliveryDate) : null;

    const firestoreData = {
      ...orderData,
      orderDate: Timestamp.fromDate(now),
      deliveryDate: deliveryDate ? Timestamp.fromDate(deliveryDate) : null,
      createdAt: Timestamp.fromDate(now),
      updatedAt: Timestamp.fromDate(now),
    };

    console.log("📤 Firestore data:", firestoreData);

    const docRef = await addDoc(collection(db, ORDERS_COLLECTION), firestoreData);
    console.log("✅ Order document created with ID:", docRef.id);

    const newDoc = await getDoc(docRef);
    const data = newDoc.data();

    if (!data) {
      console.error("❌ Failed to retrieve created order data");
      throw new Error("Gagal mengambil data pesanan yang baru dibuat");
    }

    const order = mapDocToOrder(newDoc.id, data);
    console.log("✅ Order created successfully:", order);

    return order;
  } catch (error: any) {
    console.error("❌ Error creating order:", error);
    console.error("Error details:", error.message, error.code);

    if (error.code === 'permission-denied') {
      throw new Error("Anda tidak memiliki izin untuk membuat pesanan. Silakan login kembali.");
    }

    throw new Error(error.message || "Gagal membuat pesanan. Silakan coba lagi.");
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

// Real-time listener for all orders (admin)
export function subscribeToAllOrders(
  onUpdate: (orders: Order[]) => void,
  onError?: (error: Error) => void
): () => void {
  try {
    console.log("📡 Setting up real-time listener for all orders");

    const q = query(
      collection(db, ORDERS_COLLECTION),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        console.log("📩 Real-time update received for all orders, docs:", querySnapshot.size);

        const orders = querySnapshot.docs.map(doc => {
          return mapDocToOrder(doc.id, doc.data());
        });

        onUpdate(orders);
      },
      (error) => {
        console.error("❌ Real-time listener error:", error);
        if (onError) {
          onError(new Error("Gagal mendengarkan perubahan pesanan"));
        }
      }
    );

    return unsubscribe;
  } catch (error) {
    console.error("Error setting up real-time listener:", error);
    throw new Error("Gagal mengatur pembaruan realtime");
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

// Real-time listener for user orders
export function subscribeToUserOrders(
  userId: string,
  onUpdate: (orders: Order[]) => void,
  onError?: (error: Error) => void
): () => void {
  try {
    console.log("📡 Setting up real-time listener for userId:", userId);

    const q = query(
      collection(db, ORDERS_COLLECTION),
      where("userId", "==", userId)
    );

    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        console.log("📩 Real-time update received, docs:", querySnapshot.size);

        const orders = querySnapshot.docs.map(doc => {
          return mapDocToOrder(doc.id, doc.data());
        });

        // Sort by createdAt descending
        const sortedOrders = orders.sort((a, b) => {
          const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return dateB - dateA;
        });

        onUpdate(sortedOrders);
      },
      (error) => {
        console.error("❌ Real-time listener error:", error);
        if (onError) {
          onError(new Error("Gagal mendengarkan perubahan pesanan"));
        }
      }
    );

    return unsubscribe;
  } catch (error) {
    console.error("Error setting up real-time listener:", error);
    throw new Error("Gagal mengatur pembaruan realtime");
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

export async function updateOrder(
  id: string,
  data: UpdateOrder
): Promise<void> {
  const orderRef = doc(db, ORDERS_COLLECTION, id);
  const updateData: any = {
    ...data,
    updatedAt: Timestamp.fromDate(new Date()),
  };

  if (data.deliveryDate) {
    updateData.deliveryDate = Timestamp.fromDate(new Date(data.deliveryDate));
  }

  await updateDoc(orderRef, updateData);

  // If rating is provided and order is completed, update service rating
  if (data.rating && data.status === "completed") {
    const orderDoc = await getDoc(orderRef);
    const orderData = orderDoc.data();
    if (orderData?.serviceId) {
      await updateServiceRating(orderData.serviceId);
    }
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

export async function updateOrderPaymentProof(orderId: string, paymentProofUrl: string): Promise<void> {
  try {
    const docRef = doc(db, ORDERS_COLLECTION, orderId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      throw new Error("Pesanan tidak ditemukan");
    }

    const currentAttempts = docSnap.data().uploadAttempts || 0;
    const newAttempts = currentAttempts + 1;

    // Check if attempts exceed limit
    if (newAttempts > 5) {
      await updateDoc(docRef, {
        status: "cancelled",
        paymentStatus: "rejected",
        rejectionReason: "Pesanan dibatalkan karena melebihi batas maksimal 5x upload bukti pembayaran",
        updatedAt: Timestamp.fromDate(new Date()),
      });
      throw new Error("Pesanan dibatalkan karena melebihi batas maksimal 5x upload bukti pembayaran");
    }

    await updateDoc(docRef, {
      paymentProofUrl,
      paymentStatus: "waiting_confirmation",
      uploadAttempts: newAttempts,
      rejectionReason: null, // Clear rejection reason on new upload
      updatedAt: Timestamp.fromDate(new Date()),
    });
    console.log(`✅ Payment proof updated for order: ${orderId} (Attempt ${newAttempts}/5)`);
  } catch (error) {
    console.error("Error updating payment proof:", error);
    throw error;
  }
}