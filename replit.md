# SeaVice - Platform Layanan Digital

## Overview
SeaVice is a modern digital service platform offering various services like task completion, digital products, and other digital services. It features a contemporary design with a striking white and orange theme, aiming to provide a user-friendly experience for both service seekers and providers. The platform supports a comprehensive order and payment flow, including advanced features like PWA, push notifications, and a Shopee-inspired checkout experience.

## User Preferences
No specific user preferences were provided in the original `replit.md` file.

## System Architecture
SeaVice is built as a single-page application (SPA) with a modern frontend and a serverless backend.

**UI/UX Decisions:**
- **Design System:** Utilizes a custom design system built with Tailwind CSS and Shadcn UI components, ensuring a modern, responsive, and consistent user experience.
- **Color Scheme:** Primary brand color is Orange (`#FF6B35`), complemented by white backgrounds and subtle grays for secondary elements.
- **Typography:** Employs the Inter font family from Google Fonts for headings (bold, tracking-tight) and body text (normal weight, good line-height).
- **Responsive Design:** Optimized for all screen sizes (mobile, tablet, desktop).
- **PWA Integration:** Implements Progressive Web App features for installability, offline support, and push notifications, enhancing user engagement and native app-like experience.

**Technical Implementations & Feature Specifications:**
- **Authentication:** Firebase Authentication supports email/password and Google Sign-in with role-based access control (User & Admin).
- **User Features:** Includes a landing page, user home dashboard with quick actions, service browsing, order history, and a detailed service page with voucher input.
- **Admin Features:** Provides an admin panel for CRUD operations on services and vouchers, user role management, and a dashboard with statistics.
- **Order Management:** A comprehensive order system with a detailed schema, including status lifecycle (pending, processing, completed, cancelled), payment proof uploads, and real-time order tracking.
- **Voucher System:** Supports fixed and percentage-based discounts, usage limits, expiry dates, minimum purchase requirements, and real-time discount calculation during checkout.
- **Checkout Flow:** Features a Shopee-inspired checkout page (`/checkout/:serviceId`) where users input customer details (WhatsApp, notes), apply vouchers, redeem loyalty points, and select payment methods (Bank Transfer, QRIS).
- **Payment Flow:** Streamlined payment process directly on the order confirmation page, including payment instructions, QRIS display, and integrated payment proof upload.
- **Profile Management:** Simplified user profile page for editing essential information (name, phone, address) and avatar upload.

**System Design Choices:**
- **Frontend Framework:** React + TypeScript for robust and scalable UI development.
- **State Management:** TanStack Query for efficient data fetching, caching, and synchronization.
- **Routing:** Wouter for lightweight and flexible client-side routing.
- **Form Handling:** React Hook Form with Zod for robust form validation.
- **Backend Interaction:** Direct integration with Firebase services for authentication and database operations.

## External Dependencies
- **Firebase:**
    - **Authentication:** For user authentication (email/password, Google Sign-in).
    - **Firestore Database:** Used for storing application data, including `users`, `services`, `vouchers`, and `orders` collections.
    - **Cloud Messaging (FCM):** For push notifications, specifically for payment status updates.
- **Tailwind CSS:** Utility-first CSS framework for styling.
- **Shadcn UI:** Reusable UI components.
- **Vite:** Build tool for fast development and optimized production builds.
- **Inter (Google Fonts):** Typography.
- **Railway:** (Optional) Deployment platform for Dockerized applications.
- **Docker:** Containerization for deployment flexibility.