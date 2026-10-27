import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, ScanLine, Landmark, Cloud, BarChart3,
  MapPin, Droplets, FlaskConical, BookOpen, ShoppingCart, LogOut,
  Clock, Plane, ShieldCheck
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";
import { Button } from "@/components/ui/button";

const navItems = [
  { to: "/farmer/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/farmer/weather", label: "Weather", icon: Cloud },
  { to: "/farmer/crop-scanner", label: "Crop Scanner", icon: ScanLine },
  { to: "/farmer/crop-guidance", label: "Crop Guidance", icon: BookOpen },
  { to: "/farmer/irrigation", label: "Irrigation", icon: Droplets },
  { to: "/farmer/spray-booking", label: "Drone & Spray", icon: Plane },
  { to: "/farmer/demand-supply", label: "Demand & Supply", icon: BarChart3 },
  { to: "/farmer/regional-insights", label: "Regional Insights", icon: MapPin },
  { to: "/farmer/govt-schemes", label: "Govt Schemes", icon: Landmark },
  { to: "/farmer/fertilizer", label: "AI Chatbot", icon: FlaskConical },
  { to: "/farmer/orders", label: "Orders", icon: ShoppingCart },
  { to: "/agri-chrono", label: "AgriChrono™", icon: Clock },
];

const AppSidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const { t } = useLanguage();

  const handleLogout = async () => {
    await signOut();
    navigate("/auth/login");
  };

  return (
    <aside className="w-[200px] min-h-screen bg-card border-r border-border flex flex-col py-4 px-3 shrink-0">
      <div className="flex-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.to;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors mb-0.5 ${isActive
                  ? "bg-accent text-primary font-semibold"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
            >
              <item.icon className="w-4 h-4" />
              {t(item.label)}
              {isActive && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-primary" />}
            </NavLink>
          );
        })}
      </div>
      <Button variant="ghost" onClick={handleLogout} className="w-full justify-start gap-3 text-muted-foreground hover:text-destructive mt-2">
        <LogOut className="w-4 h-4" />
        {t("Logout")}
      </Button>
    </aside>
  );
};

export default AppSidebar;
