import { z } from "zod";

// User schema with role-based access
export const userRoleSchema = z.enum(["user", "admin"]);
export type UserRole = z.infer<typeof userRoleSchema>;

export const notificationPreferencesSchema = z.object({
  orderUpdates: z.boolean().default(true),
  newOrders: z.boolean().default(true),
  marketing: z.boolean().default(false),
});

export type NotificationPreferences = z.infer<typeof notificationPreferencesSchema>;

export interface User {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
  photoURL?: string;
  phone?: string;
  address?: string;
  notificationPreferences?: NotificationPreferences;
  loyaltyPoints?: number;
  sealdo?: number; // SeaLdo balance
  createdAt: Date;
}

export const insertUserSchema = z.object({
  email: z.string().email(),
  displayName: z.string().min(2, "Nama harus minimal 2 karakter"),
  role: userRoleSchema.default("user"),
  photoURL: z.string().optional(),
  phone: z.string().min(10, "Nomor WhatsApp minimal 10 digit").regex(/^(\+62|62|0)[0-9]{9,12}$/, "Format nomor WhatsApp tidak valid"),
  address: z.string().optional(),
  notificationPreferences: notificationPreferencesSchema.optional(),
  loyaltyPoints: z.number().min(0).default(0),
  sealdo: z.number().min(0).default(0), // SeaLdo balance
});

export type InsertUser = z.infer<typeof insertUserSchema>;

export const updateUserSchema = z.object({
  displayName: z.string().min(2, "Nama harus minimal 2 karakter").optional(),
  photoURL: z.string().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  notificationPreferences: notificationPreferencesSchema.optional(),
  loyaltyPoints: z.number().min(0).optional(),
  sealdo: z.number().min(0).optional(), // SeaLdo balance
});

export type UpdateUser = z.infer<typeof updateUserSchema>;

// Service schema for digital services
export interface Service {
  id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  imageUrl?: string;
  features: string[];
  deliveryTime: string;
  orderCount: number;
  rating: number;
  createdAt: Date;
  updatedAt: Date;
}

export const insertServiceSchema = z.object({
  title: z.string().min(1, "Judul harus diisi"),
  description: z.string().min(1, "Deskripsi harus diisi"),
  price: z.number().min(0, "Harga harus positif"),
  category: z.string().min(1, "Kategori harus diisi"),
  imageUrl: z.string().optional(),
  features: z.array(z.string()).min(1, "Minimal 1 fitur harus diisi"),
  deliveryTime: z.string().min(1, "Waktu pengerjaan harus diisi"),
  orderCount: z.number().min(0).default(0),
  rating: z.number().min(0).max(5).default(5),
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
  pointsUsed?: number;
  pointsDiscount?: number;
  referralCode?: string;
  finalPrice: number;
  paymentMethod: "sealdo" | "qris";
  status: OrderStatus;
  paymentProofUrl?: string;
  paymentStatus?: "waiting_payment" | "waiting_confirmation" | "confirmed" | "rejected";
  rejectionReason?: string;
  uploadAttempts?: number;
  customerWhatsapp?: string;
  customerNotes?: string;
  rating?: number;
  review?: string;
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
  pointsUsed: z.number().min(0).optional(),
  pointsDiscount: z.number().min(0).optional(),
  referralCode: z.string().optional(),
  finalPrice: z.number().min(0, "Harga final harus positif"),
  paymentMethod: z.enum(["sealdo", "qris"]),
  status: orderStatusSchema.default("pending"),
  paymentProofUrl: z.string().optional(),
  paymentStatus: z.enum(["waiting_payment", "waiting_confirmation", "confirmed", "rejected"]).default("waiting_payment"),
  rejectionReason: z.string().optional(),
  uploadAttempts: z.number().min(0).default(0),
  customerWhatsapp: z.string().min(10, "Nomor WhatsApp minimal 10 digit").regex(/^(\+62|62|0)[0-9]{9,12}$/, "Format nomor WhatsApp tidak valid"),
  customerNotes: z.string().max(500, "Catatan maksimal 500 karakter").optional(),
  deliveryDate: z.string().optional(),
});

export type InsertOrder = z.infer<typeof insertOrderSchema>;

export const updateOrderSchema = z.object({
  status: orderStatusSchema.optional(),
  paymentProofUrl: z.string().optional(),
  paymentStatus: z.enum(["waiting_payment", "waiting_confirmation", "confirmed", "rejected"]).optional(),
  rejectionReason: z.string().optional(),
  uploadAttempts: z.number().min(0).optional(),
  notes: z.string().max(500, "Catatan maksimal 500 karakter").optional(),
  rating: z.number().min(1).max(5).optional(),
  review: z.string().max(500, "Ulasan maksimal 500 karakter").optional(),
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

// Notification Schema
export const selectNotificationSchema = z.object({
  id: z.string(),
  title: z.string().min(1, "Judul notifikasi harus diisi"),
  body: z.string().min(1, "Isi notifikasi harus diisi"),
  imageUrl: z.string().url().optional().or(z.literal("")),
  actionUrl: z.string().optional().or(z.literal("")),
  targetType: z.enum(["all", "user"]),
  userId: z.string().optional(),
  status: z.enum(["draft", "scheduled", "sent", "failed"]),
  scheduledAt: z.date().optional().nullable(),
  sentAt: z.date().optional().nullable(),
  createdAt: z.date(),
  deliveredCount: z.number().default(0),
  clickedCount: z.number().default(0),
});

export type Notification = z.infer<typeof selectNotificationSchema>;

export const insertNotificationSchema = selectNotificationSchema.omit({ 
  id: true, 
  createdAt: true,
  sentAt: true,
  deliveredCount: true,
  clickedCount: true,
});
export type InsertNotification = z.infer<typeof insertNotificationSchema>;

// Announcement Schema
export const announcementSchema = z.object({
  id: z.string(),
  title: z.string().min(1, "Judul harus diisi"),
  description: z.string().min(1, "Deskripsi harus diisi"),
  type: z.enum(["info", "promo", "new"]),
  date: z.string(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

export const insertAnnouncementSchema = announcementSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type Announcement = z.infer<typeof announcementSchema>;
export type InsertAnnouncement = z.infer<typeof insertAnnouncementSchema>;

// Product Customization Schema for managing pulsa/data products
export const productCustomizationSchema = z.object({
  id: z.string(),
  productCode: z.string(), // Code from VIP Reseller (e.g., "T5", "XL10")
  productType: z.enum(["pulsa", "data", "pln", "game", "ewallet"]),
  brand: z.string(), // TELKOMSEL, XL, INDOSAT, etc.
  isVisible: z.boolean().default(true), // Show/hide product
  customPrice: z.number().optional(), // Custom selling price (if set, overrides markup)
  markupType: z.enum(["percentage", "fixed"]).default("fixed"),
  markupValue: z.number().default(0), // Markup amount (percentage or fixed)
  sortOrder: z.number().default(0), // Display order
  customName: z.string().optional(), // Custom product name
  customNote: z.string().optional(), // Custom note/description
  isPromo: z.boolean().default(false), // Mark as promo
  promoLabel: z.string().optional(), // Promo label text
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type ProductCustomization = z.infer<typeof productCustomizationSchema>;

export const insertProductCustomizationSchema = productCustomizationSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertProductCustomization = z.infer<typeof insertProductCustomizationSchema>;

export const updateProductCustomizationSchema = insertProductCustomizationSchema.partial();
export type UpdateProductCustomization = z.infer<typeof updateProductCustomizationSchema>;

// Global Markup Settings Schema
export const globalMarkupSettingsSchema = z.object({
  id: z.string(),
  productType: z.enum(["pulsa", "data", "pln", "game", "ewallet"]),
  markupType: z.enum(["percentage", "fixed"]).default("fixed"),
  markupValue: z.number().default(0),
  isActive: z.boolean().default(true),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type GlobalMarkupSettings = z.infer<typeof globalMarkupSettingsSchema>;

export const insertGlobalMarkupSettingsSchema = globalMarkupSettingsSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertGlobalMarkupSettings = z.infer<typeof insertGlobalMarkupSettingsSchema>;