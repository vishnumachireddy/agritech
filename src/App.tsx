import React, { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ThemeProvider } from "@/hooks/useTheme";
import { LanguageProvider } from "@/hooks/useLanguage";
import { VoiceAssistantProvider } from "@/context/VoiceAssistantContext";
import FloatingVoiceAssistant from "@/components/voice/FloatingVoiceAssistant";
import RoleGuard from "@/components/RoleGuard";
import { Loader2 } from "lucide-react";

// Auth pages
import Login from "@/pages/auth/Login";
import Register from "@/pages/auth/Register";
import Landing from "@/pages/Landing";

// Core layouts (static for fast structural rendering)
import AppLayout from "./components/AppLayout";
import ConsumerLayout from "./components/ConsumerLayout";

// Route code-splitting with React.lazy
const Dashboard = lazy(() => import("./pages/Dashboard"));
const CropScanner = lazy(() => import("./pages/CropScanner"));
const GovtSchemes = lazy(() => import("./pages/GovtSchemes"));
const Weather = lazy(() => import("./pages/Weather"));
const DemandSupply = lazy(() => import("./pages/DemandSupply"));
const RegionalInsights = lazy(() => import("./pages/RegionalInsights"));
const Irrigation = lazy(() => import("./pages/Irrigation"));
const Fertilizer = lazy(() => import("./pages/Fertilizer"));
const CropGuidance = lazy(() => import("./pages/CropGuidance"));
const AgriChrono = lazy(() => import("./pages/AgriChrono"));
const DroneBooking = lazy(() => import("./pages/DroneBooking"));
const ProviderBookings = lazy(() => import("./pages/provider/ProviderBookings"));

// Consumer pages
const ConsumerDashboard = lazy(() => import("./pages/consumer/ConsumerDashboard"));
const Marketplace = lazy(() => import("./pages/consumer/Marketplace"));
const DemandTrends = lazy(() => import("./pages/consumer/DemandTrends"));
const BulkOrders = lazy(() => import("./pages/consumer/BulkOrders"));
const Traceability = lazy(() => import("./pages/consumer/Traceability"));
const MyOrders = lazy(() => import("./pages/consumer/MyOrders"));
const Profile = lazy(() => import("./pages/Profile"));
const FarmersDirectory = lazy(() => import("./pages/consumer/FarmersDirectory"));
const AgriMarket = lazy(() => import("./pages/consumer/AgriMarket"));
const OrderTracking = lazy(() => import("./pages/consumer/OrderTracking"));
const FarmerOrders = lazy(() => import("./pages/FarmerOrders"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 5, // 5 min cache in memory
      retry: 1
    }
  }
});

const RouteLoader = () => (
  <div className="min-h-[50vh] flex items-center justify-center">
    <div className="flex flex-col items-center gap-3">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
      <span className="text-xs font-medium text-muted-foreground">Loading view...</span>
    </div>
  </div>
);

const FarmerRoute = ({ children }: { children: React.ReactNode }) => (
  <RoleGuard allowedRole="farmer">
    <AppLayout>
      <Suspense fallback={<RouteLoader />}>
        {children}
      </Suspense>
    </AppLayout>
  </RoleGuard>
);

const ConsumerRoute = ({ children }: { children: React.ReactNode }) => (
  <RoleGuard allowedRole="consumer">
    <ConsumerLayout>
      <Suspense fallback={<RouteLoader />}>
        {children}
      </Suspense>
    </ConsumerLayout>
  </RoleGuard>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <LanguageProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter
            future={{
              v7_startTransition: true,
              v7_relativeSplatPath: true,
            }}
          >
            <AuthProvider>
              <VoiceAssistantProvider>
                <FloatingVoiceAssistant />
                <Suspense fallback={<RouteLoader />}>
                  <Routes>
                    {/* Public */}
                    <Route path="/" element={<Landing />} />
                    <Route path="/auth/login" element={<Login />} />
                    <Route path="/auth/register" element={<Register />} />

                    {/* Farmer routes */}
                    <Route path="/farmer/dashboard" element={<FarmerRoute><Dashboard /></FarmerRoute>} />
                    <Route path="/farmer/crop-scanner" element={<FarmerRoute><CropScanner /></FarmerRoute>} />
                    <Route path="/farmer/govt-schemes" element={<FarmerRoute><GovtSchemes /></FarmerRoute>} />
                    <Route path="/farmer/weather" element={<FarmerRoute><Weather /></FarmerRoute>} />
                    <Route path="/farmer/demand-supply" element={<FarmerRoute><DemandSupply /></FarmerRoute>} />
                    <Route path="/farmer/regional-insights" element={<FarmerRoute><RegionalInsights /></FarmerRoute>} />
                    <Route path="/farmer/irrigation" element={<FarmerRoute><Irrigation /></FarmerRoute>} />
                    <Route path="/farmer/fertilizer" element={<FarmerRoute><Fertilizer /></FarmerRoute>} />
                    <Route path="/farmer/crop-guidance" element={<FarmerRoute><CropGuidance /></FarmerRoute>} />
                    <Route path="/farmer/orders" element={<FarmerRoute><FarmerOrders /></FarmerRoute>} />
                    <Route path="/farmer/spray-booking" element={<FarmerRoute><DroneBooking /></FarmerRoute>} />
                    <Route path="/agri-chrono" element={<FarmerRoute><AgriChrono /></FarmerRoute>} />

                    {/* Consumer routes */}
                    <Route path="/consumer/dashboard" element={<ConsumerRoute><ConsumerDashboard /></ConsumerRoute>} />
                    <Route path="/consumer/farmers" element={<ConsumerRoute><FarmersDirectory /></ConsumerRoute>} />
                    <Route path="/consumer/market" element={<ConsumerRoute><AgriMarket /></ConsumerRoute>} />
                    <Route path="/consumer/marketplace" element={<ConsumerRoute><Marketplace /></ConsumerRoute>} />
                    <Route path="/consumer/demand" element={<ConsumerRoute><DemandTrends /></ConsumerRoute>} />
                    <Route path="/consumer/bulk" element={<ConsumerRoute><BulkOrders /></ConsumerRoute>} />
                    <Route path="/consumer/spray-bookings" element={<ConsumerRoute><ProviderBookings /></ConsumerRoute>} />
                    <Route path="/provider/spray-bookings" element={<ConsumerRoute><ProviderBookings /></ConsumerRoute>} />
                    <Route path="/consumer/traceability" element={<ConsumerRoute><Traceability /></ConsumerRoute>} />
                    <Route path="/consumer/orders" element={<ConsumerRoute><MyOrders /></ConsumerRoute>} />
                    <Route path="/consumer/orders/:orderId" element={<ConsumerRoute><OrderTracking /></ConsumerRoute>} />
                    <Route path="/consumer/profile" element={<ConsumerRoute><Profile /></ConsumerRoute>} />
                    <Route path="/farmer/profile" element={<FarmerRoute><Profile /></FarmerRoute>} />
                    <Route path="/profile" element={<RoleGuard><Profile /></RoleGuard>} />

                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </Suspense>
              </VoiceAssistantProvider>
            </AuthProvider>
          </BrowserRouter>
        </TooltipProvider>
      </LanguageProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
