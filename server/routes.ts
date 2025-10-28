import type { Express } from "express";
import { createServer, type Server } from "http";
import { Router, type Request, type Response } from "express";
import { sendFCMNotification } from "./fcm";

export async function registerRoutes(app: Express): Promise<Server> {
  // SeaVice uses Firebase for authentication and Firestore for data persistence
  // All data operations are handled client-side through Firebase SDK
  // This server only serves the Vite frontend

  // API routes are handled by Firebase services in client/src/lib/services.ts
  // Auth is handled by Firebase Auth in client/src/lib/auth.ts

  const router = Router();

  // Send push notification
  router.post("/api/send-notification", async (req: Request, res: Response) => {
    try {
      const { tokens, title, body, imageUrl, actionUrl, data } = req.body;

      console.log('📤 [API] Received notification request');
      console.log('📤 [API] Tokens count:', tokens?.length);
      console.log('📤 [API] Title:', title);
      console.log('📤 [API] Body:', body);

      if (!tokens || !Array.isArray(tokens) || tokens.length === 0) {
        return res.status(400).json({ error: "Tokens array is required" });
      }

      if (!title || !body) {
        return res.status(400).json({ error: "Title and body are required" });
      }

      const result = await sendFCMNotification({
        tokens,
        title,
        body,
        imageUrl,
        actionUrl,
        data,
      });

      console.log('📤 [API] Notification sent:', result);
      res.json(result);
    } catch (error: any) {
      console.error("❌ [API] Error sending notification:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.use(router);

  const httpServer = createServer(app);

  return httpServer;
}