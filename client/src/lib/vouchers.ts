import { db } from "@/lib/firebase";
import {
  collection,
  addDoc,
  getDocs,
  getDoc,
  doc,
  updateDoc,
  deleteDoc,
  query,
  where,
  Timestamp,
} from "firebase/firestore";
import type { Voucher, InsertVoucher } from "@shared/schema";

const VOUCHERS_COLLECTION = "vouchers";

function mapDocToVoucher(id: string, data: any): Voucher {
  return {
    id,
    code: data.code,
    discountType: data.discountType,
    discountValue: data.discountValue,
    isActive: data.isActive,
    minPurchase: data.minPurchase,
    maxDiscount: data.maxDiscount,
    usageLimit: data.usageLimit,
    usedCount: data.usedCount || 0,
    expiryDate: data.expiryDate?.toDate() || new Date(),
    description: data.description,
    createdAt: data.createdAt?.toDate() || new Date(),
    updatedAt: data.updatedAt?.toDate() || new Date(),
  };
}

export async function getAllVouchers(): Promise<Voucher[]> {
  try {
    const querySnapshot = await getDocs(collection(db, VOUCHERS_COLLECTION));
    return querySnapshot.docs.map((doc) => mapDocToVoucher(doc.id, doc.data()));
  } catch (error) {
    console.error("Error getting vouchers:", error);
    throw new Error("Gagal mengambil data voucher");
  }
}

export async function getVoucherById(id: string): Promise<Voucher | null> {
  try {
    const docRef = doc(db, VOUCHERS_COLLECTION, id);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      return null;
    }
    
    return mapDocToVoucher(docSnap.id, docSnap.data());
  } catch (error) {
    console.error("Error getting voucher:", error);
    throw new Error("Gagal mengambil data voucher");
  }
}

export async function getVoucherByCode(code: string): Promise<Voucher | null> {
  try {
    const q = query(
      collection(db, VOUCHERS_COLLECTION),
      where("code", "==", code.toUpperCase())
    );
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return null;
    }
    
    const doc = querySnapshot.docs[0];
    return mapDocToVoucher(doc.id, doc.data());
  } catch (error) {
    console.error("Error getting voucher by code:", error);
    throw new Error("Gagal mengambil data voucher");
  }
}

export async function createVoucher(voucherData: InsertVoucher): Promise<Voucher> {
  try {
    const now = new Date();
    const expiryDate = new Date(voucherData.expiryDate);
    
    // Check if voucher code already exists
    const existing = await getVoucherByCode(voucherData.code);
    if (existing) {
      throw new Error("Kode voucher sudah digunakan");
    }
    
    const docRef = await addDoc(collection(db, VOUCHERS_COLLECTION), {
      ...voucherData,
      code: voucherData.code.toUpperCase(),
      usedCount: 0,
      expiryDate: Timestamp.fromDate(expiryDate),
      createdAt: Timestamp.fromDate(now),
      updatedAt: Timestamp.fromDate(now),
    });

    const newDoc = await getDoc(docRef);
    const data = newDoc.data();
    
    if (!data) {
      throw new Error("Gagal mengambil data voucher yang baru dibuat");
    }
    
    return mapDocToVoucher(newDoc.id, data);
  } catch (error) {
    console.error("Error creating voucher:", error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Gagal membuat voucher");
  }
}

export async function updateVoucher(id: string, voucherData: Partial<InsertVoucher>): Promise<void> {
  try {
    const docRef = doc(db, VOUCHERS_COLLECTION, id);
    const now = new Date();
    
    const updateData: any = {
      ...voucherData,
      updatedAt: Timestamp.fromDate(now),
    };
    
    if (voucherData.code) {
      updateData.code = voucherData.code.toUpperCase();
    }
    
    if (voucherData.expiryDate) {
      updateData.expiryDate = Timestamp.fromDate(new Date(voucherData.expiryDate));
    }
    
    await updateDoc(docRef, updateData);
  } catch (error) {
    console.error("Error updating voucher:", error);
    throw new Error("Gagal memperbarui voucher");
  }
}

export async function deleteVoucher(id: string): Promise<void> {
  try {
    const docRef = doc(db, VOUCHERS_COLLECTION, id);
    await deleteDoc(docRef);
  } catch (error) {
    console.error("Error deleting voucher:", error);
    throw new Error("Gagal menghapus voucher");
  }
}

export async function validateVoucher(code: string, purchaseAmount: number): Promise<{
  valid: boolean;
  voucher?: Voucher;
  message?: string;
  discountAmount?: number;
}> {
  try {
    const voucher = await getVoucherByCode(code);
    
    if (!voucher) {
      return { valid: false, message: "Kode voucher tidak ditemukan" };
    }
    
    if (!voucher.isActive) {
      return { valid: false, message: "Voucher tidak aktif" };
    }
    
    if (new Date() > voucher.expiryDate) {
      return { valid: false, message: "Voucher sudah kadaluarsa" };
    }
    
    if (voucher.usedCount >= voucher.usageLimit) {
      return { valid: false, message: "Voucher sudah mencapai batas penggunaan" };
    }
    
    if (purchaseAmount < voucher.minPurchase) {
      return { 
        valid: false, 
        message: `Minimal pembelian Rp ${voucher.minPurchase.toLocaleString('id-ID')}` 
      };
    }
    
    let discountAmount = 0;
    if (voucher.discountType === "percentage") {
      discountAmount = (purchaseAmount * voucher.discountValue) / 100;
      if (voucher.maxDiscount && discountAmount > voucher.maxDiscount) {
        discountAmount = voucher.maxDiscount;
      }
    } else {
      discountAmount = voucher.discountValue;
    }
    
    return { 
      valid: true, 
      voucher, 
      discountAmount,
      message: "Voucher valid" 
    };
  } catch (error) {
    console.error("Error validating voucher:", error);
    return { valid: false, message: "Gagal memvalidasi voucher" };
  }
}

export async function incrementVoucherUsage(id: string): Promise<void> {
  try {
    const voucher = await getVoucherById(id);
    if (!voucher) {
      throw new Error("Voucher tidak ditemukan");
    }
    
    const docRef = doc(db, VOUCHERS_COLLECTION, id);
    await updateDoc(docRef, {
      usedCount: voucher.usedCount + 1,
      updatedAt: Timestamp.fromDate(new Date()),
    });
  } catch (error) {
    console.error("Error incrementing voucher usage:", error);
    throw new Error("Gagal memperbarui penggunaan voucher");
  }
}
