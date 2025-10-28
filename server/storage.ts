import { type User, type InsertUser } from "@shared/schema";
import { randomUUID } from "crypto";

// modify the interface with any CRUD methods
// you might need

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;

  constructor() {
    this.users = new Map();
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }
}

export const storage = new MemStorage();

// Update order with payment proof
export async function uploadPaymentProof(orderId: string, imageUrl: string) {
  const { db } = await import("./index");
  const { doc, updateDoc, Timestamp } = await import("firebase/firestore");

  const orderRef = doc(db, "orders", orderId);
  await updateDoc(orderRef, {
    paymentProofUrl: imageUrl,
    paymentStatus: "waiting_confirmation",
    updatedAt: Timestamp.fromDate(new Date()),
  });
}