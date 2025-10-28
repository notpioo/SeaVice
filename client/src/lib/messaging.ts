
import { getToken, onMessage } from "firebase/messaging";
import { messaging } from "./firebase";
import { db } from "./firebase";
import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  updateDoc,
  doc,
  deleteDoc,
  Timestamp,
  orderBy,
  limit,
} from "firebase/firestore";
import type { InsertNotification, Notification } from "@shared/schema";

const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY;

// Request notification permission and get FCM token
export async function requestNotificationPermission(): Promise<string | null> {
  try {
    console.log('🔔 Requesting notification permission...');
    console.log('🔔 Current permission:', Notification.permission);
    
    // Check if notifications are supported
    if (!('Notification' in window)) {
      console.error('❌ This browser does not support notifications');
      return null;
    }

    // Check if service workers are supported
    if (!('serviceWorker' in navigator)) {
      console.error('❌ Service workers are not supported');
      return null;
    }

    // Request permission jika belum granted
    let permission = Notification.permission;
    if (permission !== 'granted') {
      permission = await Notification.requestPermission();
      console.log('🔔 Permission result:', permission);
    } else {
      console.log('🔔 Permission already granted');
    }

    if (permission === 'granted') {
      // Wait for service worker to be ready
      const registration = await navigator.serviceWorker.ready;
      console.log('✅ Service Worker ready');

      if (!VAPID_KEY) {
        console.error('❌ VAPID Key is missing');
        return null;
      }

      console.log('🔑 Getting FCM token...');
      
      const token = await getToken(messaging, {
        vapidKey: VAPID_KEY,
        serviceWorkerRegistration: registration
      });

      if (!token) {
        console.error('❌ No token received from Firebase');
        return null;
      }

      console.log('✅ FCM Token obtained:', token.substring(0, 30) + '...');
      
      return token;
    } else {
      console.warn('⚠️ Notification permission denied or dismissed');
      alert('Mohon aktifkan notifikasi untuk menerima update pesanan Anda!');
    }

    return null;
  } catch (error) {
    console.error('❌ Error getting notification permission:', error);
    if (error instanceof Error) {
      console.error('Error details:', error.message);
      console.error('Error stack:', error.stack);
    }
    return null;
  }
}

// Save FCM token to Firestore
export async function saveFCMToken(userId: string, token: string) {
  try {
    console.log('💾 Saving FCM token for user:', userId);
    const tokensRef = collection(db, "fcmTokens");
    const q = query(tokensRef, where("userId", "==", userId), where("token", "==", token));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      await addDoc(tokensRef, {
        userId,
        token,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
      console.log('✅ New token saved');
    } else {
      const docRef = doc(db, "fcmTokens", snapshot.docs[0].id);
      await updateDoc(docRef, {
        updatedAt: Timestamp.now(),
      });
      console.log('✅ Token updated');
    }
  } catch (error) {
    console.error("❌ Error saving FCM token:", error);
    throw error;
  }
}

// Get all FCM tokens
export async function getAllFCMTokens(): Promise<string[]> {
  try {
    const tokensRef = collection(db, "fcmTokens");
    const snapshot = await getDocs(tokensRef);
    const tokens = snapshot.docs.map((doc) => doc.data().token);
    console.log(`📱 Found ${tokens.length} FCM tokens`);
    return tokens;
  } catch (error) {
    console.error("Error getting FCM tokens:", error);
    throw error;
  }
}

// Get FCM tokens for specific user
export async function getUserFCMTokens(userId: string): Promise<string[]> {
  try {
    const tokensRef = collection(db, "fcmTokens");
    const q = query(tokensRef, where("userId", "==", userId));
    const snapshot = await getDocs(q);
    const tokens = snapshot.docs.map((doc) => doc.data().token);
    console.log(`📱 Found ${tokens.length} tokens for user ${userId}`);
    return tokens;
  } catch (error) {
    console.error("Error getting user FCM tokens:", error);
    throw error;
  }
}

// Setup foreground message listener
export function setupMessageListener(callback: (payload: any) => void): () => void {
  if (!messaging) {
    console.warn('⚠️ Messaging not initialized, cannot setup listener');
    return () => {};
  }

  console.log('✅ Setting up foreground message listener');

  const unsubscribe = onMessage(messaging, (payload) => {
    console.log("📩 [Foreground] Message received:", payload);
    console.log("📩 [Foreground] Title:", payload.notification?.title || payload.data?.title);
    console.log("📩 [Foreground] Body:", payload.notification?.body || payload.data?.body);
    callback(payload);
  });

  return unsubscribe;
}

// Create notification in Firestore
export async function createNotification(
  data: InsertNotification
): Promise<Notification> {
  try {
    const notificationsRef = collection(db, "notifications");
    const docRef = await addDoc(notificationsRef, {
      ...data,
      createdAt: Timestamp.now(),
      sentAt: data.scheduledAt ? null : Timestamp.now(),
      status: data.scheduledAt ? "scheduled" : "sent",
    });

    const snapshot = await getDocs(query(collection(db, "notifications"), where("__name__", "==", docRef.id)));
    const doc = snapshot.docs[0];
    return {
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt.toDate(),
      sentAt: doc.data().sentAt?.toDate() || null,
      scheduledAt: doc.data().scheduledAt?.toDate() || null,
    } as Notification;
  } catch (error) {
    console.error("Error creating notification:", error);
    throw error;
  }
}

// Get all notifications
export async function getAllNotifications(): Promise<Notification[]> {
  try {
    const notificationsRef = collection(db, "notifications");
    const q = query(notificationsRef, orderBy("createdAt", "desc"), limit(100));
    const snapshot = await getDocs(q);

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt.toDate(),
      sentAt: doc.data().sentAt?.toDate() || null,
      scheduledAt: doc.data().scheduledAt?.toDate() || null,
    })) as Notification[];
  } catch (error) {
    console.error("Error getting notifications:", error);
    throw error;
  }
}

// Update notification
export async function updateNotification(
  id: string,
  data: Partial<InsertNotification>
): Promise<void> {
  try {
    const notificationRef = doc(db, "notifications", id);
    await updateDoc(notificationRef, data);
  } catch (error) {
    console.error("Error updating notification:", error);
    throw error;
  }
}

// Delete notification
export async function deleteNotification(id: string): Promise<void> {
  try {
    const notificationRef = doc(db, "notifications", id);
    await deleteDoc(notificationRef);
  } catch (error) {
    console.error("Error deleting notification:", error);
    throw error;
  }
}

// Delete invalid FCM token from Firestore
export async function deleteInvalidToken(token: string): Promise<void> {
  try {
    const tokensRef = collection(db, "fcmTokens");
    const q = query(tokensRef, where("token", "==", token));
    const snapshot = await getDocs(q);

    for (const doc of snapshot.docs) {
      await deleteDoc(doc.ref);
      console.log(`🗑️ Deleted invalid token: ${token.substring(0, 20)}...`);
    }
  } catch (error) {
    console.error("Error deleting invalid token:", error);
  }
}

// Send push notification via FCM
export async function sendPushNotification(data: {
  title: string;
  body: string;
  targetType: "all" | "user";
  userId?: string;
  imageUrl?: string;
  actionUrl?: string;
}): Promise<{ successCount: number; failureCount: number }> {
  try {
    const tokens =
      data.targetType === "all"
        ? await getAllFCMTokens()
        : data.userId
        ? await getUserFCMTokens(data.userId)
        : [];

    if (tokens.length === 0) {
      console.warn("⚠️ No FCM tokens found");
      return { successCount: 0, failureCount: 0 };
    }

    console.log(`📤 Sending notification to ${tokens.length} devices`);
    console.log('📝 Notification data:', { title: data.title, body: data.body });

    const response = await fetch('/api/send-notification', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        tokens, 
        title: data.title,
        body: data.body,
        imageUrl: data.imageUrl,
        actionUrl: data.actionUrl,
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to send notification: ${response.statusText} - ${errorText}`);
    }

    const result = await response.json();
    console.log('✅ Notification sent successfully:', result);

    // Cleanup invalid tokens if any
    if (result.invalidTokens && result.invalidTokens.length > 0) {
      console.log(`🧹 Cleaning up ${result.invalidTokens.length} invalid tokens...`);
      await Promise.all(
        result.invalidTokens.map((token: string) => deleteInvalidToken(token))
      );
      console.log('✅ Invalid tokens cleaned up');
    }

    return result;
  } catch (error) {
    console.error("❌ Error sending push notification:", error);
    throw error;
  }
}
