import type { ReactElement } from "react";
import { Toaster } from "./components/ui/toaster";
import { Toaster as Sonner } from "./components/ui/sonner";
import { TooltipProvider } from "./components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Index from "./pages/Index";
import RatForm from "./pages/RatForm";
import NotFound from "./pages/NotFound";
import SupportCenter from "./pages/SupportCenter";
import ServiceManager from "./pages/ServiceManager";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ProfilePage from "./pages/ProfilePage";
import ReportsPage from "./pages/ReportsPage";
import { ServiceManagerProvider } from "./hooks/use-service-manager";
import { RatAutofillProvider } from "./context/RatAutofillContext";
import { useAuth } from "./context/AuthContext";
import { Loader2 } from "lucide-react";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children }: { children: ReactElement }) => {
  const { user, loadingAuth } = useAuth();

  if (loadingAuth) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-primary">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <ServiceManagerProvider>
          <RatAutofillProvider>
            <Routes>
              <Route
                path="/"
                element={(
                  <ProtectedRoute>
                    <Index />
                  </ProtectedRoute>
                )}
              />
              <Route
                path="/rat"
                element={(
                  <ProtectedRoute>
                    <RatForm />
                  </ProtectedRoute>
                )}
              />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route
                path="/support"
                element={(
                  <ProtectedRoute>
                    <SupportCenter />
                  </ProtectedRoute>
                )}
              />
              <Route
                path="/service-manager"
                element={(
                  <ProtectedRoute>
                    <ServiceManager />
                  </ProtectedRoute>
                )}
              />
              <Route
                path="/profile"
                element={(
                  <ProtectedRoute>
                    <ProfilePage />
                  </ProtectedRoute>
                )}
              />
              <Route
                path="/reports"
                element={(
                  <ProtectedRoute>
                    <ReportsPage />
                  </ProtectedRoute>
                )}
              />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </RatAutofillProvider>
        </ServiceManagerProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
