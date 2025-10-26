import { z } from "zod";

// User schema with role-based access
export const userRoleSchema = z.enum(["user", "admin"]);
export type UserRole = z.infer<typeof userRoleSchema>;

export interface User {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
  photoURL?: string;
  createdAt: Date;
}

export const insertUserSchema = z.object({
  email: z.string().email(),
  displayName: z.string().min(2, "Nama harus minimal 2 karakter"),
  role: userRoleSchema.default("user"),
  photoURL: z.string().optional(),
});

export type InsertUser = z.infer<typeof insertUserSchema>;

// Service schema for digital services
export interface Service {
  id: string;
  title: string;
  description: string;
  category: string;
  price: number;
  imageUrl?: string;
  features: string[];
  deliveryTime: string;
  createdAt: Date;
  updatedAt: Date;
}

export const insertServiceSchema = z.object({
  title: z.string().min(3, "Judul harus minimal 3 karakter"),
  description: z.string().min(10, "Deskripsi harus minimal 10 karakter"),
  category: z.string().min(2, "Kategori harus diisi"),
  price: z.number().min(0, "Harga harus positif"),
  imageUrl: z.string().optional(),
  features: z.array(z.string()).min(1, "Minimal 1 fitur harus diisi"),
  deliveryTime: z.string().min(1, "Waktu pengerjaan harus diisi"),
});

export type InsertService = z.infer<typeof insertServiceSchema>;

export const updateServiceSchema = insertServiceSchema.partial();
export type UpdateService = z.infer<typeof updateServiceSchema>;

// Order schema for service orders
export const orderStatusSchema = z.enum([
  "pending",
  "processing",
  "completed",
  "cancelled"
]);
export type OrderStatus = z.infer<typeof orderStatusSchema>;

export interface Order {
  id: string;
  userId: string;
  serviceId: string;
  serviceName: string;
  originalPrice: number;
  servicePrice: number;
  voucherCode?: string;
  discountAmount?: number;
  finalPrice: number;
  status: OrderStatus;
  notes?: string;
  orderDate: Date;
  deliveryDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export const insertOrderSchema = z.object({
  userId: z.string().min(1, "User ID harus diisi"),
  serviceId: z.string().min(1, "Service ID harus diisi"),
  serviceName: z.string().min(1, "Nama layanan harus diisi"),
  originalPrice: z.number().min(0, "Harga original harus positif"),
  servicePrice: z.number().min(0, "Harga harus positif"),
  voucherCode: z.string().optional(),
  discountAmount: z.number().min(0).optional(),
  finalPrice: z.number().min(0, "Harga final harus positif"),
  status: orderStatusSchema.default("pending"),
  notes: z.string().max(500, "Catatan maksimal 500 karakter").optional(),
  deliveryDate: z.string().optional(),
});

export type InsertOrder = z.infer<typeof insertOrderSchema>;

export const updateOrderSchema = z.object({
  status: orderStatusSchema.optional(),
  notes: z.string().max(500, "Catatan maksimal 500 karakter").optional(),
  deliveryDate: z.string().optional(),
});

export type UpdateOrder = z.infer<typeof updateOrderSchema>;

// Voucher schema for discount vouchers
export const discountTypeSchema = z.enum(["percentage", "fixed"]);
export type DiscountType = z.infer<typeof discountTypeSchema>;

export interface Voucher {
  id: string;
  code: string;
  discountType: DiscountType;
  discountValue: number;
  isActive: boolean;
  minPurchase: number;
  maxDiscount?: number;
  usageLimit: number;
  usedCount: number;
  expiryDate: Date;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

export const insertVoucherSchema = z.object({
  code: z.string()
    .min(3, "Kode voucher minimal 3 karakter")
    .max(20, "Kode voucher maksimal 20 karakter")
    .regex(/^[A-Z0-9]+$/, "Kode voucher hanya boleh huruf kapital dan angka"),
  discountType: discountTypeSchema,
  discountValue: z.number()
    .min(0, "Nilai diskon harus positif"),
  isActive: z.boolean().default(true),
  minPurchase: z.number().min(0, "Minimal pembelian harus positif").default(0),
  maxDiscount: z.number().min(0, "Maksimal diskon harus positif").optional(),
  usageLimit: z.number().min(1, "Limit penggunaan minimal 1").default(100),
  expiryDate: z.string().min(1, "Tanggal kadaluarsa harus diisi"),
  description: z.string().max(200, "Deskripsi maksimal 200 karakter").optional(),
}).refine((data) => {
  if (data.discountType === "percentage" && data.discountValue > 100) {
    return false;
  }
  return true;
}, {
  message: "Persentase diskon maksimal 100%",
  path: ["discountValue"]
});

export type InsertVoucher = z.infer<typeof insertVoucherSchema>;

export const updateVoucherSchema = z.object({
  code: z.string()
    .min(3, "Kode voucher minimal 3 karakter")
    .max(20, "Kode voucher maksimal 20 karakter")
    .regex(/^[A-Z0-9]+$/, "Kode voucher hanya boleh huruf kapital dan angka")
    .optional(),
  discountType: discountTypeSchema.optional(),
  discountValue: z.number()
    .min(0, "Nilai diskon harus positif")
    .optional(),
  isActive: z.boolean().optional(),
  minPurchase: z.number().min(0, "Minimal pembelian harus positif").optional(),
  maxDiscount: z.number().min(0, "Maksimal diskon harus positif").optional(),
  usageLimit: z.number().min(1, "Limit penggunaan minimal 1").optional(),
  expiryDate: z.string().min(1, "Tanggal kadaluarsa harus diisi").optional(),
  description: z.string().max(200, "Deskripsi maksimal 200 karakter").optional(),
}).refine((data) => {
  if (data.discountType === "percentage" && data.discountValue && data.discountValue > 100) {
    return false;
  }
  return true;
}, {
  message: "Persentase diskon maksimal 100%",
  path: ["discountValue"]
});
