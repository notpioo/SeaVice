import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Landing from "@/pages/Landing";
import Login from "@/pages/Login";
import Register from "@/pages/Register";

import Services from "@/pages/Services";
import ServiceDetail from "@/pages/ServiceDetail";
import OrderConfirmation from "@/pages/OrderConfirmation";
import Orders from "@/pages/Orders";
import Admin from "@/pages/Admin";
import NotFound from "@/pages/not-found";

function Router() {
  const [location] = useLocation();
  const isAuthPage = location === "/login" || location === "/register";

  return (
    <div className="flex flex-col min-h-screen">
      {!isAuthPage && <Navbar />}
      <main className={!isAuthPage ? "pt-16 flex-1 flex flex-col" : "flex-1"}>
        <Switch>
          <Route path="/" component={Landing} />
          <Route path="/login" component={Login} />
          <Route path="/register" component={Register} />
          <Route path="/layanan" component={Services} />
          <Route path="/layanan/:id" component={ServiceDetail} />
          <Route path="/pesanan/:orderId">
            <ProtectedRoute requiredRole="user">
              <OrderConfirmation />
            </ProtectedRoute>
          </Route>
          <Route path="/pesanan">
            <ProtectedRoute requiredRole="user">
              <Orders />
            </ProtectedRoute>
          </Route>
          
          <Route path="/admin">
            <ProtectedRoute requiredRole="admin">
              <Admin />
            </ProtectedRoute>
          </Route>
          <Route component={NotFound} />
        </Switch>
      </main>
      {!isAuthPage && <Footer />}
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <Toaster />
          <Router />
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;