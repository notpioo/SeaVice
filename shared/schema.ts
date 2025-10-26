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
  servicePrice: number;
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
  servicePrice: z.number().min(0, "Harga harus positif"),
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
