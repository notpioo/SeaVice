// Authentication utilities for Firebase
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  User as FirebaseUser,
  onAuthStateChanged
} from "firebase/auth";
import { doc, setDoc, getDoc, Timestamp } from "firebase/firestore"; // Import Timestamp
import { auth, db } from "./firebase";
import type { User, UserRole } from "@shared/schema";

const googleProvider = new GoogleAuthProvider();

// Register new user with email and password
export async function registerWithEmail(
  email: string,
  password: string,
  displayName: string,
  phone: string,
  role: UserRole = "user"
): Promise<User> {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const firebaseUser = userCredential.user;

  const userDocRef = doc(db, "users", firebaseUser.uid); // Define userDocRef here

  const user: User = {
    id: firebaseUser.uid,
    email: firebaseUser.email!,
    displayName,
    phone,
    role,
    createdAt: new Date(),
  };

  // Add SeaLdo initialization
  user.sealdo = 0;

  // Only add photoURL if it exists
  if (firebaseUser.photoURL) {
    user.photoURL = firebaseUser.photoURL;
  }

  await setDoc(userDocRef, user);
  return user;
}

// Sign in with email and password
export async function signInWithEmail(email: string, password: string): Promise<User> {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  const userDoc = await getDoc(doc(db, "users", userCredential.user.uid));

  if (!userDoc.exists()) {
    throw new Error("User data not found");
  }

  return userDoc.data() as User;
}

// Sign in with Google
export async function signInWithGoogle(): Promise<User> {
  const userCredential = await signInWithPopup(auth, googleProvider);
  const firebaseUser = userCredential.user;

  const userDocRef = doc(db, "users", firebaseUser.uid);
  const userDoc = await getDoc(userDocRef);

  if (userDoc.exists()) {
    return userDoc.data() as User;
  }

  const newUser: User = {
    id: firebaseUser.uid,
    email: firebaseUser.email!,
    displayName: firebaseUser.displayName || "User",
    role: "user",
    createdAt: new Date(),
  };

  // Add SeaLdo initialization
  newUser.sealdo = 0;

  // Only add photoURL if it exists
  if (firebaseUser.photoURL) {
    newUser.photoURL = firebaseUser.photoURL;
  }

  await setDoc(userDocRef, newUser);
  return newUser;
}

// Sign out
export async function signOut(): Promise<void> {
  await firebaseSignOut(auth);
}

// Get current user from Firestore
export async function getCurrentUser(): Promise<User | null> {
  const firebaseUser = auth.currentUser;
  if (!firebaseUser) return null;

  const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));
  if (!userDoc.exists()) return null;

  return userDoc.data() as User;
}

// Auth state observer
export function onAuthStateChange(callback: (user: User | null) => void) {
  return auth.onAuthStateChanged(async (firebaseUser) => {
    if (firebaseUser) {
      try {
        // Force token refresh to get latest claims
        await firebaseUser.getIdToken(true);

        // Get fresh user data from Firestore
        const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));

        if (userDoc.exists()) {
          const userData = userDoc.data();
          callback({
            id: firebaseUser.uid,
            email: firebaseUser.email || "",
            displayName: firebaseUser.displayName || userData.displayName || "",
            photoURL: firebaseUser.photoURL || null,
            role: userData.role || "user",
            phone: userData.phone || null,
            address: userData.address || null,
            loyaltyPoints: userData.loyaltyPoints || 0,
            sealdo: userData.sealdo || 0, // Load SeaLdo from Firestore
            notificationPreferences: userData.notificationPreferences || {
              orderUpdates: true,
              newOrders: true,
              marketing: false,
            },
          });
        } else {
          callback(null);
        }
      } catch (error) {
        console.error("Error refreshing user data:", error);
        callback(null);
      }
    } else {
      callback(null);
    }
  });
}