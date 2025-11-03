import {
  doc,
  getDoc,
  updateDoc,
  Timestamp,
  DocumentData,
} from "firebase/firestore";
import { db } from "./firebase";
import type { User, UpdateUser } from "@shared/schema";

const USERS_COLLECTION = "users";

export function mapDocToUser(id: string, data: DocumentData): User {
  return {
    id,
    email: data.email,
    displayName: data.displayName,
    role: data.role,
    photoURL: data.photoURL,
    phone: data.phone,
    address: data.address,
    notificationPreferences: data.notificationPreferences || {
      orderUpdates: true,
      newOrders: true,
      marketing: false,
    },
    loyaltyPoints: data.loyaltyPoints || 0,
    createdAt: data.createdAt?.toDate(),
  };
}

export async function getUserById(userId: string): Promise<User | null> {
  try {
    const userDocRef = doc(db, USERS_COLLECTION, userId);
    const userDoc = await getDoc(userDocRef);

    if (!userDoc.exists()) {
      return null;
    }

    return mapDocToUser(userDoc.id, userDoc.data());
  } catch (error) {
    console.error("Error getting user:", error);
    throw error;
  }
}

export async function updateUserProfile(
  userId: string,
  updates: UpdateUser
): Promise<void> {
  try {
    const userDocRef = doc(db, USERS_COLLECTION, userId);

    const updateData: any = {
      ...updates,
      updatedAt: Timestamp.now(),
    };

    await updateDoc(userDocRef, updateData);
    console.log("✅ User profile updated successfully");
  } catch (error) {
    console.error("❌ Error updating user profile:", error);
    throw error;
  }
}

export async function addLoyaltyPoints(
  userId: string,
  points: number
): Promise<void> {
  try {
    const userDocRef = doc(db, USERS_COLLECTION, userId);
    const userDoc = await getDoc(userDocRef);

    if (!userDoc.exists()) {
      throw new Error("User not found");
    }

    const currentPoints = userDoc.data().loyaltyPoints || 0;
    const newPoints = currentPoints + points;

    await updateDoc(userDocRef, {
      loyaltyPoints: newPoints,
      updatedAt: Timestamp.now(),
    });

    console.log(`✅ Added ${points} loyalty points. New total: ${newPoints}`);
  } catch (error) {
    console.error("❌ Error adding loyalty points:", error);
    throw error;
  }
}

export async function deductLoyaltyPoints(
  userId: string,
  points: number
): Promise<void> {
  try {
    const userDocRef = doc(db, USERS_COLLECTION, userId);
    const userDoc = await getDoc(userDocRef);

    if (!userDoc.exists()) {
      throw new Error("User not found");
    }

    const currentPoints = userDoc.data().loyaltyPoints || 0;

    if (currentPoints < points) {
      throw new Error("Insufficient loyalty points");
    }

    const newPoints = currentPoints - points;

    await updateDoc(userDocRef, {
      loyaltyPoints: newPoints,
      updatedAt: Timestamp.now(),
    });

    console.log(`✅ Deducted ${points} loyalty points. New total: ${newPoints}`);
  } catch (error) {
    console.error("❌ Error deducting loyalty points:", error);
    throw error;
  }
}
