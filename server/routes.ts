import type { Express } from "express";
import { createServer, type Server } from "http";
import { Router, type Request, type Response } from "express";
import { sendFCMNotification } from "./fcm";
import multer from "multer";
import cloudinary from "./cloudinary";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

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

  // Upload payment proof to Cloudinary
  app.post("/api/upload-payment-proof", upload.single("file"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).send({ message: "No file uploaded" });
      }

      // Upload to Cloudinary
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'payment-proofs',
          resource_type: 'image'
        },
        (error, result) => {
          if (error) {
            console.error("Cloudinary upload error:", error);
            return res.status(500).send({ message: "Failed to upload image" });
          }

          // Return Cloudinary URL
          res.json({ imageUrl: result?.secure_url });
        }
      );

      // Stream buffer to Cloudinary
      uploadStream.end(req.file.buffer);
    } catch (error: any) {
      console.error("Upload error:", error);
      res.status(500).send({ message: error.message });
    }
  });

  // Upload service image to Cloudinary
  app.post("/api/upload-service-image", upload.single("image"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).send({ message: "No file uploaded" });
      }

      // Upload to Cloudinary
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'service-images',
          resource_type: 'image'
        },
        (error, result) => {
          if (error) {
            console.error("Cloudinary upload error:", error);
            return res.status(500).send({ message: "Failed to upload image" });
          }

          // Return Cloudinary URL
          res.json({ imageUrl: result?.secure_url });
        }
      );

      // Stream buffer to Cloudinary
      uploadStream.end(req.file.buffer);
    } catch (error: any) {
      console.error("Upload error:", error);
      res.status(500).send({ message: error.message });
    }
  });

  app.use(router);

  const httpServer = createServer(app);

  return httpServer;
}