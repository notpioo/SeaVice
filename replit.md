# SeaVice - Platform Layanan Digital

## Overview
SeaVice adalah platform modern untuk jasa servis digital yang menyediakan berbagai layanan seperti pengerjaan tugas, produk digital, dan jasa digital lainnya. Website ini dibangun dengan desain yang sangat modern dengan tema warna putih-orange yang menarik.

## Tech Stack
- **Frontend**: React + TypeScript, Tailwind CSS, Shadcn UI
- **Backend**: Firebase Authentication & Firestore
- **Routing**: Wouter
- **State Management**: TanStack Query
- **Build Tool**: Vite
- **Styling**: Tailwind CSS dengan design system custom

## Features
### Authentication
- Email/Password authentication via Firebase Auth
- Google Sign-in integration
- Role-based access control (User & Admin)
- Automatic redirect berdasarkan role user

### User Features (Role: User)
- Landing page dengan hero section yang menarik
- Halaman Home user dengan quick actions dan statistics
- Browse dan lihat daftar layanan yang tersedia
- Responsive design untuk semua platform

### Admin Features (Role: Admin)
- Admin panel untuk mengelola layanan
- CRUD operations untuk layanan (Create, Read, Update, Delete)
- Admin voucher management dengan CRUD operations lengkap
- Dashboard dengan statistics
- Form management dengan validasi lengkap

### Pages
1. **Landing Page** (`/`) - Hero section, features, statistics, CTA
2. **Login** (`/login`) - Email/password dan Google sign-in
3. **Register** (`/register`) - Registrasi user baru
4. **Home User** (`/home`) - Dashboard untuk user (Protected, role: user)
5. **Layanan** (`/layanan`) - Daftar semua layanan yang tersedia
6. **Admin Panel** (`/admin`) - Manage layanan dan voucher (Protected, role: admin)

## Firebase Configuration
Project menggunakan Firebase untuk:
- **Authentication**: Email/password dan Google provider
- **Firestore Database**: 
  - Collection `users`: Menyimpan data user dengan field role
  - Collection `services`: Menyimpan data layanan digital
  - Collection `vouchers`: Menyimpan voucher dengan diskon fixed/percentage
  - Collection `orders`: Menyimpan pesanan dengan detail harga dan voucher

### Required Environment Variables
```
VITE_FIREBASE_API_KEY=AIzaSyCmGVvlQ8QciED-R6EShzOxuGmZ_hiHKO4
VITE_FIREBASE_APP_ID=1:243409020515:web:cfe39747aa24eaacd43a56
VITE_FIREBASE_PROJECT_ID=seavice-a25e0
```

## Project Structure
```
client/
├── src/
│   ├── components/
│   │   ├── ui/           # Shadcn UI components
│   │   ├── Navbar.tsx    # Navigation bar dengan mobile menu
│   │   ├── Footer.tsx    # Footer dengan links dan contact info
│   │   └── ProtectedRoute.tsx  # Route protection dengan role check
│   ├── contexts/
│   │   └── AuthContext.tsx     # Auth state management
│   ├── lib/
│   │   ├── firebase.ts   # Firebase initialization
│   │   ├── auth.ts       # Authentication functions
│   │   ├── services.ts   # Firestore service operations
│   │   ├── vouchers.ts   # Voucher CRUD operations
│   │   └── orders.ts     # Order management
│   ├── pages/
│   │   ├── Landing.tsx   # Landing page
│   │   ├── Login.tsx     # Login page
│   │   ├── Register.tsx  # Register page
│   │   ├── Home.tsx      # User home page
│   │   ├── Services.tsx  # Services listing
│   │   ├── ServiceDetail.tsx  # Service detail dengan voucher input
│   │   ├── Orders.tsx    # User order history
│   │   ├── OrderConfirmation.tsx  # Konfirmasi pesanan
│   │   ├── Admin.tsx     # Admin panel (services + vouchers)
│   │   └── AdminVouchers.tsx  # Voucher management UI
│   └── App.tsx           # Main app with routing
shared/
└── schema.ts             # Shared TypeScript types & Zod schemas
```

## Design System
### Colors
- **Primary**: Orange (#FF6B35 / HSL: 24 95% 53%) - Brand color
- **Background**: White (Light) / Dark Gray (Dark mode)
- **Accent**: Orange variations untuk highlights
- **Muted**: Subtle gray untuk secondary text

### Typography
- **Font Family**: Inter (Google Fonts)
- **Headings**: Bold, tracking-tight
- **Body**: Normal weight, good line-height untuk readability

### Components
- Menggunakan Shadcn UI components
- Custom styling dengan Tailwind CSS
- Hover dan active states dengan elevation system
- Responsive design untuk mobile, tablet, dan desktop

## Development
```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

## Deployment

### Option 1: Replit Deployments
Website ini dioptimalkan untuk deployment di Replit Deployments.

**Deployment Steps:**
1. Pastikan semua Firebase environment variables sudah diset
2. Klik tombol "Deploy" di Replit
3. Tambahkan deployment domain ke Firebase Console:
   - Go to Firebase Console > Authentication > Settings > Authorized domains
   - Tambahkan domain `.replit.app` atau custom domain

### Option 2: Railway Deployment (Docker)
Project sudah dilengkapi dengan konfigurasi Docker untuk deployment di Railway.

**Files:**
- `Dockerfile` - Multi-stage build yang optimized (Alpine-based, ~100MB)
- `.dockerignore` - Exclude unnecessary files
- `railway.toml` - Railway configuration
- `DEPLOYMENT.md` - Panduan lengkap deployment

**Quick Deploy:**
1. Push ke GitHub repository
2. Login ke Railway.app
3. Deploy from GitHub repo
4. Set environment variables di Railway Dashboard
5. Railway akan otomatis build & deploy

**Server Configuration:**
- Server sudah bind ke `0.0.0.0` (required untuk Railway)
- Dynamic PORT dari `process.env.PORT`
- Production-ready dengan non-root user
- Graceful shutdown support

Lihat `DEPLOYMENT.md` untuk panduan lengkap.

## User Roles
### Creating Admin User
Untuk membuat user dengan role admin:
1. Register user baru melalui halaman register
2. Di Firebase Console > Firestore > users collection
3. Edit document user tersebut dan ubah field `role` menjadi `"admin"`
4. User akan otomatis diredirect ke admin panel saat login

## Recent Changes

### PWA Implementation (October 2024)
- **Progressive Web App**: SeaVice sekarang bisa di-install seperti native app
  - Installable di mobile (Android/iOS) dan desktop
  - Offline support dengan Service Worker caching
  - Auto-update notification dengan PWAUpdatePrompt component
  - Runtime caching untuk Google Fonts dan Firebase Storage
  - Custom PWA icons dengan branding orange SeaVice
  - Manifest configuration dengan theme color #FF6B35
  - TypeScript support untuk virtual PWA modules
  - Production-ready untuk Replit dan Railway deployment
  - See `PWA.md` untuk dokumentasi lengkap

### December 2024
- **Service Detail Page**: Halaman detail layanan dengan informasi lengkap, fitur, harga, dan tombol pemesanan
- **Order System**: Complete order schema dengan status lifecycle (pending, processing, completed, cancelled), Firestore CRUD operations
- **Order Placement Flow**: Order dialog dengan form validasi, integrasi Firebase, redirect ke halaman konfirmasi
- **Order Confirmation Page**: Halaman konfirmasi pesanan dengan detail lengkap, next steps, dan action buttons
- **User Order Dashboard**: Halaman /pesanan untuk melihat riwayat pesanan dengan filter by status dan sort by date/price
- **Date Handling**: Fixed proper Date object handling untuk Firestore Timestamps
- **Navigation**: Added "Pesanan" link to navbar untuk user role
- **Test IDs**: Comprehensive data-testid attributes across all interactive elements
- **Voucher System** (October 2024):
  - Complete voucher schema dengan support diskon fixed amount (Rp.) dan percentage (%)
  - Admin voucher CRUD dengan UI lengkap (create, edit, delete)
  - Voucher validation di order flow dengan real-time discount calculation
  - Usage limit tracking dan expiry date enforcement
  - Minimum purchase requirement validation
  - Automatic voucher removal ketika quantity berubah untuk mencegah incorrect discount
  - Order pricing transparency dengan originalPrice, discountAmount, dan finalPrice
  - Voucher display di order confirmation page
- **Payment Proof Bug Fixes** (October 28, 2025):
  - Fixed payment proof images not appearing in admin panel (added updateOrderPaymentProof function)
  - Fixed misleading "Pesanan Berhasil Dibuat" message - now shows status-specific messages:
    - "Menunggu Pembayaran" untuk waiting_payment status
    - "Menunggu Konfirmasi Pembayaran" untuk waiting_confirmation status
    - "Pembayaran Dikonfirmasi" untuk confirmed status
    - "Pembayaran Ditolak" untuk rejected status
  - Payment proof URL now properly saved to Firestore with paymentStatus update
  - Query cache invalidation after upload ensures real-time updates
- **Push Notifications for Payment Updates** (October 28, 2025):
  - Automatic push notifications when admin confirms or rejects payment
  - Uses existing FCM infrastructure with sendPushNotification function
  - Notifications include actionable deep links to order detail page (`/pesanan/:id`)
  - Admin sees confirmation in toast when notification is sent
  - Error handling ensures admin workflow continues even if notification fails
  - Users receive:
    - "✅ Pembayaran Dikonfirmasi" when payment is approved
    - "❌ Pembayaran Ditolak" when payment is rejected

### October 29, 2025
- **Description Line Break Fix**:
  - Added `whitespace-pre-line` CSS class to all service description displays
  - Service descriptions now properly preserve line breaks and newlines entered by admin
  - Applied to:
    - Services catalog listing (with 2-line truncation for layout consistency)
    - Service detail page (mobile view - full description with line breaks)
    - Service detail page (desktop view - full description with line breaks)
  - Users can now format service descriptions with multiple paragraphs for better readability
