
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
  onSnapshot,
} from "firebase/firestore";
import { db } from "./firebase";
import type { Announcement, InsertAnnouncement } from "@shared/schema";

const COLLECTION_NAME = "announcements";

export async function getAllAnnouncements(): Promise<Announcement[]> {
  const q = query(
    collection(db, COLLECTION_NAME),
    orderBy("createdAt", "desc")
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      title: data.title,
      description: data.description,
      type: data.type,
      date: data.date,
      createdAt: data.createdAt?.toDate(),
      updatedAt: data.updatedAt?.toDate(),
    } as Announcement;
  });
}

export async function createAnnouncement(
  announcement: InsertAnnouncement
): Promise<string> {
  const docRef = await addDoc(collection(db, COLLECTION_NAME), {
    ...announcement,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });
  return docRef.id;
}

export async function updateAnnouncement(
  id: string,
  announcement: Partial<InsertAnnouncement>
): Promise<void> {
  const docRef = doc(db, COLLECTION_NAME, id);
  await updateDoc(docRef, {
    ...announcement,
    updatedAt: Timestamp.now(),
  });
}

export async function deleteAnnouncement(id: string): Promise<void> {
  const docRef = doc(db, COLLECTION_NAME, id);
  await deleteDoc(docRef);
}

export function subscribeToAnnouncements(
  onUpdate: (announcements: Announcement[]) => void,
  onError?: (error: Error) => void
) {
  const q = query(
    collection(db, COLLECTION_NAME),
    orderBy("createdAt", "desc")
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const announcements = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          title: data.title,
          description: data.description,
          type: data.type,
          date: data.date,
          createdAt: data.createdAt?.toDate(),
          updatedAt: data.updatedAt?.toDate(),
        } as Announcement;
      });
      onUpdate(announcements);
    },
    (error) => {
      console.error("Error in announcements subscription:", error);
      if (onError) onError(error);
    }
  );
}
