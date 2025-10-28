import { Route, Switch } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { AuthProvider } from "./contexts/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { Navbar } from "./components/Navbar";
import { Footer } from "./components/Footer";
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
// PWA Update Prompt disabled to prevent reload loop
// import { PWAUpdatePrompt } from "./components/PWAUpdatePrompt";
import { Toaster } from "./components/ui/toaster";
import { useEffect } from "react";
import { requestNotificationPermission, saveFCMToken, setupMessageListener } from "@/lib/messaging";
import { useToast } from "./hooks/use-toast";
import { useAuth } from "./contexts/AuthContext";

function AppContent() {
  const { user } = useAuth();
  const { toast } = useToast();

  // Register Firebase Cloud Messaging service worker
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      // Unregister SEMUA service workers dulu
      navigator.serviceWorker.getRegistrations().then(async (registrations) => {
        console.log('🔍 Found service workers:', registrations.length);
        
        for (const registration of registrations) {
          console.log('🗑️ Unregistering service worker...');
          await registration.unregister();
        }

        // Tunggu sebentar untuk memastikan unregister selesai
        await new Promise(resolve => setTimeout(resolve, 500));

        // Register firebase-messaging-sw.js
        const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
          scope: '/',
          type: 'classic'
        });
        
        console.log('✅ FCM Service Worker registered');

        // Tunggu hingga service worker aktif
        await navigator.serviceWorker.ready;
        console.log('✅ Service Worker ready');

        const activeWorker = registration.active;
        if (activeWorker) {
          console.log('✅ Active SW:', activeWorker.scriptURL);
          console.log('✅ SW State:', activeWorker.state);
        }
      }).catch((error) => {
        console.error('❌ FCM Service Worker registration failed:', error);
      });
    }
  }, []);

  // Setup Firebase Cloud Messaging for logged in users
  useEffect(() => {
    if (user) {
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
      setupMessageListener((payload) => {
        console.log('📩 [App] Foreground message received:', payload);

        const title = payload.notification?.title || payload.data?.title || "Notifikasi Baru";
        const body = payload.notification?.body || payload.data?.body || "";

        console.log('📩 [App] Showing notification - Title:', title, 'Body:', body);

        // Tampilkan toast
        toast({
          title: title,
          description: body,
          duration: 5000,
        });

        // PASTI tampilkan notifikasi browser
        if ('Notification' in window && Notification.permission === 'granted') {
          console.log('📩 [App] Creating browser notification');
          const notification = new Notification(title, {
            body: body,
            icon: '/icons/pwa-192x192.png',
            badge: '/icons/pwa-192x192.png',
            tag: 'seavice-' + Date.now(),
            requireInteraction: true,
            vibrate: [300, 100, 200],
          });

          notification.onclick = () => {
            window.focus();
            notification.close();
          };

          console.log('✅ Browser notification created');
        } else {
          console.warn('⚠️ Cannot show notification - Permission:', Notification.permission);
        }
      });
    }
  }, [user, toast]);

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow">
        <Switch>
          <Route path="/" component={Landing} />
          <Route path="/login" component={Login} />
          <Route path="/register" component={Register} />
          <Route path="/services" component={Services} />
          <Route path="/services/:id" component={ServiceDetail} />
          <Route path="/orders">
            <ProtectedRoute>
              <Orders />
            </ProtectedRoute>
          </Route>
          <Route path="/order-confirmation/:orderId">
            <ProtectedRoute>
              <OrderConfirmation />
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