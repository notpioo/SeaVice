
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

// Generate unique device ID based on browser fingerprint
function getDeviceId(): string {
  const navigatorInfo = navigator.userAgent + navigator.language;
  const screenInfo = `${screen.width}x${screen.height}x${screen.colorDepth}`;
  const timezoneOffset = new Date().getTimezoneOffset();
  
  const fingerprint = `${navigatorInfo}-${screenInfo}-${timezoneOffset}`;
  
  let hash = 0;
  for (let i = 0; i < fingerprint.length; i++) {
    const char = fingerprint.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  
  return `device-${Math.abs(hash).toString(36)}`;
}

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
      if (!VAPID_KEY) {
        console.error('❌ VAPID Key is missing');
        return null;
      }

      // Register Firebase Messaging service worker explicitly
      console.log('📦 Registering Firebase Messaging Service Worker...');
      const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
        scope: '/',
        type: 'classic'
      });
      
      // Wait for it to be active
      await navigator.serviceWorker.ready;
      console.log('✅ Firebase Messaging Service Worker ready');

      console.log('🔑 Getting FCM token with correct service worker...');
      
      // CRITICAL: Pass the firebase-messaging-sw.js registration to getToken
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
    const deviceId = getDeviceId();
    console.log('💾 Saving FCM token for user:', userId);
    console.log('📱 Device ID:', deviceId);
    
    const tokensRef = collection(db, "fcmTokens");
    
    // Hapus semua token lama dari device yang sama untuk user ini
    const oldDeviceTokensQuery = query(
      tokensRef, 
      where("userId", "==", userId), 
      where("deviceId", "==", deviceId)
    );
    const oldDeviceTokens = await getDocs(oldDeviceTokensQuery);
    
    for (const docSnapshot of oldDeviceTokens.docs) {
      await deleteDoc(docSnapshot.ref);
      console.log('🗑️ Deleted old token from same device');
    }
    
    // Cek apakah token yang sama sudah ada (dari device lain)
    const existingTokenQuery = query(tokensRef, where("userId", "==", userId), where("token", "==", token));
    const existingToken = await getDocs(existingTokenQuery);

    if (existingToken.empty) {
      // Simpan token baru dengan device ID
      await addDoc(tokensRef, {
        userId,
        token,
        deviceId,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
      console.log('✅ New token saved with device ID');
    } else {
      // Update existing token dengan device ID
      const docRef = doc(db, "fcmTokens", existingToken.docs[0].id);
      await updateDoc(docRef, {
        deviceId,
        updatedAt: Timestamp.now(),
      });
      console.log('✅ Token updated with device ID');
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

// Clean up duplicate tokens - keep only the latest token per device
export async function cleanupDuplicateTokens(userId: string): Promise<number> {
  try {
    console.log('🧹 Cleaning up duplicate tokens for user:', userId);
    const tokensRef = collection(db, "fcmTokens");
    const q = query(tokensRef, where("userId", "==", userId));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      console.log('✅ No tokens found for user');
      return 0;
    }

    // Group tokens by device ID
    const tokensByDevice = new Map<string, any[]>();
    snapshot.docs.forEach((doc) => {
      const data = doc.data();
      const deviceId = data.deviceId || 'unknown';
      
      if (!tokensByDevice.has(deviceId)) {
        tokensByDevice.set(deviceId, []);
      }
      
      tokensByDevice.get(deviceId)!.push({
        id: doc.id,
        ref: doc.ref,
        ...data
      });
    });

    let deletedCount = 0;

    // For each device, keep only the latest token
    for (const [deviceId, tokens] of Array.from(tokensByDevice.entries())) {
      if (tokens.length > 1) {
        // Sort by updatedAt, keep the latest
        tokens.sort((a: any, b: any) => {
          const aTime = a.updatedAt?.toMillis() || 0;
          const bTime = b.updatedAt?.toMillis() || 0;
          return bTime - aTime;
        });

        // Delete all except the first (latest)
        for (let i = 1; i < tokens.length; i++) {
          await deleteDoc(tokens[i].ref);
          console.log(`🗑️ Deleted duplicate token for device ${deviceId}`);
          deletedCount++;
        }
      }
    }

    console.log(`✅ Cleanup complete: deleted ${deletedCount} duplicate tokens`);
    return deletedCount;
  } catch (error) {
    console.error("Error cleaning up duplicate tokens:", error);
    return 0;
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
