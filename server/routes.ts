import type { Express } from "express";
import { createServer, type Server } from "http";
import { Router, type Request, type Response } from "express";
import { sendFCMNotification } from "./fcm";
import multer from "multer";
import cloudinary from "./cloudinary";
import {
  getAllProductCustomizations,
  getProductCustomization,
  saveProductCustomization,
  saveBulkProductCustomizations,
  deleteProductCustomization,
  getAllGlobalMarkupSettings,
  getGlobalMarkupSetting,
  saveGlobalMarkupSetting,
  initializeDefaultGlobalMarkup,
} from "./firestore";

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

  // Initialize default global markup settings on startup
  initializeDefaultGlobalMarkup().catch(err => {
    console.error('❌ [Firestore] Failed to initialize default markup:', err);
  });

  // Get all product customizations (from Firestore)
  router.get("/api/admin/product-customizations", async (req: Request, res: Response) => {
    try {
      const customizations = await getAllProductCustomizations();
      res.json({ result: true, data: customizations });
    } catch (error: any) {
      console.error('❌ [Admin API] Error fetching customizations:', error);
      res.status(500).json({ result: false, message: error.message });
    }
  });

  // Get product customization by code (from Firestore)
  router.get("/api/admin/product-customizations/:code", async (req: Request, res: Response) => {
    try {
      const { code } = req.params;
      const customization = await getProductCustomization(code);
      if (customization) {
        res.json({ result: true, data: customization });
      } else {
        res.json({ result: false, data: null, message: "Customization not found" });
      }
    } catch (error: any) {
      console.error('❌ [Admin API] Error fetching customization:', error);
      res.status(500).json({ result: false, message: error.message });
    }
  });

  // Create or update product customization (to Firestore)
  router.post("/api/admin/product-customizations", async (req: Request, res: Response) => {
    try {
      const customization = req.body;
      const updatedCustomization = await saveProductCustomization(customization);
      res.json({ result: true, data: updatedCustomization });
    } catch (error: any) {
      console.error('❌ [Admin API] Error saving customization:', error);
      res.status(500).json({ result: false, message: error.message });
    }
  });

  // Bulk update product customizations (to Firestore)
  router.post("/api/admin/product-customizations/bulk", async (req: Request, res: Response) => {
    try {
      const { customizations } = req.body;
      const count = await saveBulkProductCustomizations(customizations);
      console.log('✅ [Admin API] Bulk customizations saved:', count);
      res.json({ result: true, message: `${count} products updated` });
    } catch (error: any) {
      console.error('❌ [Admin API] Error saving bulk customizations:', error);
      res.status(500).json({ result: false, message: error.message });
    }
  });

  // Delete product customization (from Firestore)
  router.delete("/api/admin/product-customizations/:code", async (req: Request, res: Response) => {
    try {
      const { code } = req.params;
      await deleteProductCustomization(code);
      console.log('✅ [Admin API] Product customization deleted:', code);
      res.json({ result: true, message: "Customization deleted" });
    } catch (error: any) {
      console.error('❌ [Admin API] Error deleting customization:', error);
      res.status(500).json({ result: false, message: error.message });
    }
  });

  // Get global markup settings (from Firestore)
  router.get("/api/admin/global-markup", async (req: Request, res: Response) => {
    try {
      const settings = await getAllGlobalMarkupSettings();
      res.json({ result: true, data: settings });
    } catch (error: any) {
      console.error('❌ [Admin API] Error fetching global markup:', error);
      res.status(500).json({ result: false, message: error.message });
    }
  });

  // Update global markup settings (to Firestore)
  router.post("/api/admin/global-markup", async (req: Request, res: Response) => {
    try {
      const setting = req.body;
      const updatedSetting = await saveGlobalMarkupSetting(setting);
      console.log('✅ [Admin API] Global markup saved:', setting.productType);
      res.json({ result: true, data: updatedSetting });
    } catch (error: any) {
      console.error('❌ [Admin API] Error saving global markup:', error);
      res.status(500).json({ result: false, message: error.message });
    }
  });

  // VIP Reseller - Get Pulsa Services (with customization applied)
  router.post("/api/pulsa/services", async (req: Request, res: Response) => {
    try {
      const { filter_type, filter_value, brand_filter, apply_customization } = req.body;

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

      // Apply customizations if requested (for customer-facing pages)
      if (apply_customization !== false && data.result && Array.isArray(data.data)) {
        // Fetch customizations from Firestore
        const [globalPulsaMarkup, allCustomizations] = await Promise.all([
          getGlobalMarkupSetting('pulsa'),
          getAllProductCustomizations()
        ]);
        
        // Create a map for quick lookup
        const customizationsMap = new Map(allCustomizations.map(c => [c.productCode, c]));
        
        data.data = data.data.map((service: any) => {
          const customization = customizationsMap.get(service.code);
          
          // Check visibility - if customization exists and is hidden, mark for filtering
          if (customization && customization.isVisible === false) {
            return { ...service, _hidden: true };
          }
          
          // Calculate selling price
          let sellingPrice = service.price.basic;
          
          // Apply custom price if set
          if (customization?.customPrice) {
            sellingPrice = customization.customPrice;
          } else if (customization?.markupValue) {
            // Apply per-product markup
            if (customization.markupType === 'percentage') {
              sellingPrice = Math.ceil(service.price.basic * (1 + customization.markupValue / 100));
            } else {
              sellingPrice = service.price.basic + customization.markupValue;
            }
          } else if (globalPulsaMarkup?.isActive && globalPulsaMarkup.markupValue > 0) {
            // Apply global markup
            if (globalPulsaMarkup.markupType === 'percentage') {
              sellingPrice = Math.ceil(service.price.basic * (1 + globalPulsaMarkup.markupValue / 100));
            } else {
              sellingPrice = service.price.basic + globalPulsaMarkup.markupValue;
            }
          }
          
          return {
            ...service,
            name: customization?.customName || service.name,
            note: customization?.customNote || service.note,
            originalPrice: service.price.basic,
            sellingPrice: sellingPrice,
            isPromo: customization?.isPromo || false,
            promoLabel: customization?.promoLabel || null,
            sortOrder: customization?.sortOrder || 0,
          };
        }).filter((service: any) => !service._hidden); // Remove hidden products
        
        // Sort by custom order if any
        data.data.sort((a: any, b: any) => (a.sortOrder || 0) - (b.sortOrder || 0));
      }

      console.log('📱 [Pulsa API] Response:', data.message);
      console.log('📱 [Pulsa API] Services count:', data.data?.length || 0);

      res.json(data);
    } catch (error: any) {
      console.error('❌ [Pulsa API] Error:', error);
      res.status(500).json({ result: false, data: [], message: error.message });
    }
  });

  // VIP Reseller - Get Raw Services (for admin without customization)
  router.post("/api/pulsa/services/raw", async (req: Request, res: Response) => {
    try {
      const { filter_type, filter_value, brand_filter } = req.body;

      if (!VIPRESELLER_API_KEY || !VIPRESELLER_SIGN) {
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
      
      if (filter_type) formData.append('filter_type', filter_type);
      if (filter_value) formData.append('filter_value', filter_value);

      const response = await fetch(VIPRESELLER_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formData.toString(),
      });

      if (!response.ok) {
        return res.status(response.status).json({ 
          result: false, 
          data: [],
          message: `HTTP Error: ${response.status}` 
        });
      }

      const text = await response.text();
      let data = JSON.parse(text);

      // Filter by brand if provided
      if (brand_filter && data.result && Array.isArray(data.data)) {
        data.data = data.data.filter((service: any) => 
          service.brand && service.brand.toUpperCase() === brand_filter.toUpperCase()
        );
      }

      // Add customization info to each service (from Firestore)
      if (data.result && Array.isArray(data.data)) {
        const allCustomizations = await getAllProductCustomizations();
        const customizationsMap = new Map(allCustomizations.map(c => [c.productCode, c]));
        
        data.data = data.data.map((service: any) => {
          const customization = customizationsMap.get(service.code);
          return {
            ...service,
            customization: customization || null,
          };
        });
      }

      res.json(data);
    } catch (error: any) {
      console.error('❌ [Pulsa API Raw] Error:', error);
      res.status(500).json({ result: false, data: [], message: error.message });
    }
  });

  app.use(router);

  const httpServer = createServer(app);

  return httpServer;
}