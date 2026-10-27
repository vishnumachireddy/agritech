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

// Auth pages
import Login from "@/pages/auth/Login";
import Register from "@/pages/auth/Register";
import Landing from "@/pages/Landing";

// Farmer layout & pages
import AppLayout from "./components/AppLayout";
import Dashboard from "./pages/Dashboard";
import CropScanner from "./pages/CropScanner";
import GovtSchemes from "./pages/GovtSchemes";
import Weather from "./pages/Weather";
import DemandSupply from "./pages/DemandSupply";
import RegionalInsights from "./pages/RegionalInsights";
import Irrigation from "./pages/Irrigation";
import Fertilizer from "./pages/Fertilizer";
import CropGuidance from "./pages/CropGuidance";
import AgriChrono from "./pages/AgriChrono";
import DroneBooking from "./pages/DroneBooking";
import ProviderBookings from "./pages/provider/ProviderBookings";

// Consumer layout & pages
import ConsumerLayout from "./components/ConsumerLayout";
import ConsumerDashboard from "./pages/consumer/ConsumerDashboard";
import Marketplace from "./pages/consumer/Marketplace";
import DemandTrends from "./pages/consumer/DemandTrends";
import BulkOrders from "./pages/consumer/BulkOrders";
import Traceability from "./pages/consumer/Traceability";
import MyOrders from "./pages/consumer/MyOrders";
import Profile from "./pages/Profile";
import FarmersDirectory from "./pages/consumer/FarmersDirectory";
import AgriMarket from "./pages/consumer/AgriMarket";
import OrderTracking from "./pages/consumer/OrderTracking";
import FarmerOrders from "./pages/FarmerOrders";

import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const FarmerRoute = ({ children }: { children: React.ReactNode }) => (
  <RoleGuard allowedRole="farmer">
    <AppLayout>{children}</AppLayout>
  </RoleGuard>
);

const ConsumerRoute = ({ children }: { children: React.ReactNode }) => (
  <RoleGuard allowedRole="consumer">
    <ConsumerLayout>{children}</ConsumerLayout>
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
              </VoiceAssistantProvider>
            </AuthProvider>
          </BrowserRouter>
        </TooltipProvider>
      </LanguageProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
