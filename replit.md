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
- Dashboard dengan statistics
- Form management dengan validasi lengkap

### Pages
1. **Landing Page** (`/`) - Hero section, features, statistics, CTA
2. **Login** (`/login`) - Email/password dan Google sign-in
3. **Register** (`/register`) - Registrasi user baru
4. **Home User** (`/home`) - Dashboard untuk user (Protected, role: user)
5. **Layanan** (`/layanan`) - Daftar semua layanan yang tersedia
6. **Admin Panel** (`/admin`) - Manage layanan (Protected, role: admin)

## Firebase Configuration
Project menggunakan Firebase untuk:
- **Authentication**: Email/password dan Google provider
- **Firestore Database**: 
  - Collection `users`: Menyimpan data user dengan field role
  - Collection `services`: Menyimpan data layanan digital

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
│   │   └── services.ts   # Firestore service operations
│   ├── pages/
│   │   ├── Landing.tsx   # Landing page
│   │   ├── Login.tsx     # Login page
│   │   ├── Register.tsx  # Register page
│   │   ├── Home.tsx      # User home page
│   │   ├── Services.tsx  # Services listing
│   │   └── Admin.tsx     # Admin panel
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
Website ini dioptimalkan untuk deployment di Replit Deployments. Tidak menggunakan Docker karena environment Replit tidak mendukung containerization.

### Deployment Steps:
1. Pastikan semua Firebase environment variables sudah diset
2. Klik tombol "Deploy" di Replit
3. Tambahkan deployment domain ke Firebase Console:
   - Go to Firebase Console > Authentication > Settings > Authorized domains
   - Tambahkan domain `.replit.app` atau custom domain

## User Roles
### Creating Admin User
Untuk membuat user dengan role admin:
1. Register user baru melalui halaman register
2. Di Firebase Console > Firestore > users collection
3. Edit document user tersebut dan ubah field `role` menjadi `"admin"`
4. User akan otomatis diredirect ke admin panel saat login

## Recent Changes (December 2024)
- **Service Detail Page**: Halaman detail layanan dengan informasi lengkap, fitur, harga, dan tombol pemesanan
- **Order System**: Complete order schema dengan status lifecycle (pending, processing, completed, cancelled), Firestore CRUD operations
- **Order Placement Flow**: Order dialog dengan form validasi, integrasi Firebase, redirect ke halaman konfirmasi
- **Order Confirmation Page**: Halaman konfirmasi pesanan dengan detail lengkap, next steps, dan action buttons
- **User Order Dashboard**: Halaman /pesanan untuk melihat riwayat pesanan dengan filter by status dan sort by date/price
- **Date Handling**: Fixed proper Date object handling untuk Firestore Timestamps
- **Navigation**: Added "Pesanan" link to navbar untuk user role
- **Test IDs**: Comprehensive data-testid attributes across all interactive elements
