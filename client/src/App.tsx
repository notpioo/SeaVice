import { Route, Switch } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { AuthProvider } from "./contexts/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { Navbar } from "./components/Navbar";
import { Footer } from "./components/Footer";
import Landing from "./pages/Landing";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Services from "./pages/Services";
import ServiceDetail from "./pages/ServiceDetail";
import Checkout from "./pages/Checkout";
import Orders from "./pages/Orders";
import OrderConfirmation from "./pages/OrderConfirmation";
import Payment from "./pages/Payment";
import Profile from "./pages/Profile";
import Admin from "./pages/Admin";
import AdminOrders from "./pages/AdminOrders";
import AdminVouchers from "./pages/AdminVouchers";
import AdminNotifications from "./pages/AdminNotifications";
import NotFound from "./pages/not-found";
// PWA Update Prompt disabled to prevent reload loop
// import { PWAUpdatePrompt } from "./components/PWAUpdatePrompt";
import { Toaster } from "./components/ui/toaster";
import { useEffect } from "react";
import { requestNotificationPermission, saveFCMToken, setupMessageListener, cleanupDuplicateTokens } from "@/lib/messaging";
import { useToast } from "./hooks/use-toast";
import { useAuth } from "./contexts/AuthContext";

function AppContent() {
  const { user } = useAuth();
  const { toast } = useToast();

  // Setup Firebase Cloud Messaging for logged in users
  // Note: Service worker registration is now handled in requestNotificationPermission()
  useEffect(() => {
    if (!user) return;

    // Cleanup duplicate tokens first
    cleanupDuplicateTokens(user.id)
      .then((deletedCount) => {
        if (deletedCount > 0) {
          console.log(`🧹 Cleaned up ${deletedCount} duplicate tokens`);
        }
      })
      .catch((error) => {
        console.error('❌ Error cleaning up tokens:', error);
      });

    requestNotificationPermission()
      .then(async (token) => {
        if (token) {
          console.log('✅ FCM Token obtained:', token);
          await saveFCMToken(user.id, token);
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

    // Listen for foreground messages
    const unsubscribe = setupMessageListener((payload) => {
      console.log('📩 [App] Foreground message received:', payload);

      const title = payload.notification?.title || payload.data?.title || "Notifikasi Baru";
      const body = payload.notification?.body || payload.data?.body || "";

      console.log('📩 [App] Showing toast notification - Title:', title, 'Body:', body);

      // Hanya tampilkan toast untuk foreground messages
      // Background messages akan ditangani oleh service worker
      toast({
        title: title,
        description: body,
        duration: 5000,
      });
    });

    // Cleanup listener saat komponen unmount atau user berubah
    return () => {
      console.log('🧹 Cleaning up message listener');
      unsubscribe();
    };
  }, [user, toast]);

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow pt-16 md:pt-20">
        <Switch>
          <Route path="/" component={Landing} />
          <Route path="/beranda">
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          </Route>
          <Route path="/login" component={Login} />
          <Route path="/register" component={Register} />
          <Route path="/services" component={Services} />
          <Route path="/layanan" component={Services} />
          <Route path="/services/:id" component={ServiceDetail} />
          <Route path="/layanan/:id" component={ServiceDetail} />
          <Route path="/checkout/:serviceId">
            <ProtectedRoute>
              <Checkout />
            </ProtectedRoute>
          </Route>
          <Route path="/orders">
            <ProtectedRoute>
              <Orders />
            </ProtectedRoute>
          </Route>
          <Route path="/pesanan">
            <ProtectedRoute>
              <Orders />
            </ProtectedRoute>
          </Route>
          <Route path="/order-confirmation/:orderId">
            <ProtectedRoute>
              <OrderConfirmation />
            </ProtectedRoute>
          </Route>
          <Route path="/pesanan/:orderId">
            <ProtectedRoute>
              <OrderConfirmation />
            </ProtectedRoute>
          </Route>
          <Route path="/payment/:orderId">
            <ProtectedRoute>
              <Payment />
            </ProtectedRoute>
          </Route>
          <Route path="/profile">
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          </Route>
          <Route path="/admin">
            <ProtectedRoute requiredRole="admin">
              <Admin />
            </ProtectedRoute>
          </Route>
          <Route path="/admin/orders">
            <ProtectedRoute requiredRole="admin">
              <AdminOrders />
            </ProtectedRoute>
          </Route>
          <Route path="/admin/vouchers">
            <ProtectedRoute requiredRole="admin">
              <AdminVouchers />
            </ProtectedRoute>
          </Route>
          <Route path="/admin/notifications">
            <ProtectedRoute requiredRole="admin">
              <AdminNotifications />
            </ProtectedRoute>
          </Route>
          <Route component={NotFound} />
        </Switch>
      </main>
      <Footer />
      <Toaster />
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </QueryClientProvider>
  );
}