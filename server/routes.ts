import type { Express } from "express";
import { createServer, type Server } from "http";
import { Router, type Request, type Response } from "express";
import { sendFCMNotification } from "./fcm";
import multer from "multer";
import cloudinary from "./cloudinary";

// VIP Reseller API Configuration
const VIPRESELLER_API_URL = "https://vip-reseller.co.id/api/prepaid";
const VIPRESELLER_API_KEY = process.env.VIPRESELLER_API_KEY || "";
const VIPRESELLER_SIGN = process.env.VIPRESELLER_SIGN || "";

console.log('🔑 [Config] VIP Reseller API Key loaded:', VIPRESELLER_API_KEY ? '✅ Yes' : '❌ No');
console.log('🔑 [Config] VIP Reseller Sign loaded:', VIPRESELLER_SIGN ? '✅ Yes' : '❌ No');

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

  // Upload avatar to Cloudinary
  app.post("/api/upload-avatar", upload.single("avatar"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).send({ message: "No file uploaded" });
      }

      // Upload to Cloudinary
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'avatars',
          resource_type: 'image',
          transformation: [
            { width: 500, height: 500, crop: 'fill', gravity: 'face' },
            { quality: 'auto' }
          ]
        },
        (error, result) => {
          if (error) {
            console.error("Cloudinary upload error:", error);
            return res.status(500).send({ message: "Failed to upload avatar" });
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

  // VIP Reseller - Get Pulsa Services
  router.post("/api/pulsa/services", async (req: Request, res: Response) => {
    try {
      const { filter_type, filter_value, brand_filter } = req.body;

      console.log('📱 [Pulsa API] Fetching services');
      console.log('📱 [Pulsa API] Filter type:', filter_type);
      console.log('📱 [Pulsa API] Filter value:', filter_value);
      console.log('📱 [Pulsa API] Brand filter:', brand_filter);

      if (!VIPRESELLER_API_KEY || !VIPRESELLER_SIGN) {
        console.error('❌ [Pulsa API] Missing API credentials');
        return res.status(500).json({ 
          result: false, 
          data: [],
          message: "API credentials not configured" 
        });
      }

      const formData = new URLSearchParams();
      formData.append('key', VIPRESELLER_API_KEY);
      formData.append('sign', VIPRESELLER_SIGN);
      formData.append('type', 'services');
      
      if (filter_type) {
        formData.append('filter_type', filter_type);
      }
      if (filter_value) {
        formData.append('filter_value', filter_value);
      }

      const response = await fetch(VIPRESELLER_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
      });

      if (!response.ok) {
        console.error('❌ [Pulsa API] HTTP Error:', response.status);
        return res.status(response.status).json({ 
          result: false, 
          data: [],
          message: `HTTP Error: ${response.status}` 
        });
      }

      const text = await response.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch (parseError) {
        console.error('❌ [Pulsa API] Failed to parse response:', text.substring(0, 200));
        return res.status(500).json({ 
          result: false, 
          data: [],
          message: "Invalid response from provider" 
        });
      }

      // Filter by brand if brand_filter is provided
      if (brand_filter && data.result && Array.isArray(data.data)) {
        data.data = data.data.filter((service: any) => 
          service.brand && service.brand.toUpperCase() === brand_filter.toUpperCase()
        );
        console.log('📱 [Pulsa API] Filtered by brand:', brand_filter);
      }

      console.log('📱 [Pulsa API] Response:', data.message);
      console.log('📱 [Pulsa API] Services count:', data.data?.length || 0);

      res.json(data);
    } catch (error: any) {
      console.error('❌ [Pulsa API] Error:', error);
      res.status(500).json({ result: false, data: [], message: error.message });
    }
  });

  app.use(router);

  const httpServer = createServer(app);

  return httpServer;
}