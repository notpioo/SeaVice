import type { Express } from "express";
import { createServer, type Server } from "http";

export async function registerRoutes(app: Express): Promise<Server> {
  // SeaVice uses Firebase for authentication and Firestore for data persistence
  // All data operations are handled client-side through Firebase SDK
  // This server only serves the Vite frontend
  
  // API routes are handled by Firebase services in client/src/lib/services.ts
  // Auth is handled by Firebase Auth in client/src/lib/auth.ts

  const httpServer = createServer(app);

  return httpServer;
}
