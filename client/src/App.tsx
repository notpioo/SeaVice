
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Services from "./pages/Services";
import ServiceDetail from "./pages/ServiceDetail";
import Orders from "./pages/Orders";
import OrderConfirmation from "./pages/OrderConfirmation";
import Admin from "./pages/Admin";
import AdminOrders from "./pages/AdminOrders";
import AdminVouchers from "./pages/AdminVouchers";
import AdminNotifications from "./pages/AdminNotifications";
import NotFound from "./pages/not-found";
import PWAUpdatePrompt from "./components/PWAUpdatePrompt";
import { Toaster } from "./components/ui/toaster";
import { useEffect } from "react";
import { requestNotificationPermission, saveFCMToken, setupMessageListener } from "./lib/messaging";
import { useAuth } from "./contexts/AuthContext";
import { useToast } from "./hooks/use-toast";

function AppContent() {
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/firebase-messaging-sw.js', {
        scope: '/',
        type: 'classic'
      }).then((registration) => {
        console.log('FCM Service Worker registered:', registration);
      }).catch((error) => {
        console.error('FCM Service Worker registration failed:', error);
      });
    }
  }, []);

  useEffect(() => {
    if (user) {
      requestNotificationPermission()
        .then(async (token) => {
          if (token) {
            console.log('✅ FCM Token obtained:', token);
            await saveFCMToken(user.uid, token);
            console.log('✅ Token saved to Firestore');
            
            toast({
              title: "Notifikasi diaktifkan",
              description: "Anda akan menerima notifikasi push",
            });
          } else {
            console.warn('⚠️ No FCM token obtained - permission might be denied');
          }
        })
        .catch((error) => {
          console.error('❌ Error setting up notifications:', error);
        });

      setupMessageListener((payload) => {
        console.log('📩 Foreground message received:', payload);
        
        toast({
          title: payload.notification?.title || "Notifikasi Baru",
          description: payload.notification?.body || "",
        });
      });
    }
  }, [user, toast]);

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow">
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/services" element={<Services />} />
          <Route path="/services/:id" element={<ServiceDetail />} />
          <Route
            path="/orders"
            element={
              <ProtectedRoute>
                <Orders />
              </ProtectedRoute>
            }
          />
          <Route
            path="/order-confirmation/:orderId"
            element={
              <ProtectedRoute>
                <OrderConfirmation />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute requireAdmin>
                <Admin />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/orders"
            element={
              <ProtectedRoute requireAdmin>
                <AdminOrders />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/vouchers"
            element={
              <ProtectedRoute requireAdmin>
                <AdminVouchers />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/notifications"
            element={
              <ProtectedRoute requireAdmin>
                <AdminNotifications />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
      <Toaster />
      <PWAUpdatePrompt />
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <AppContent />
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  );
}
