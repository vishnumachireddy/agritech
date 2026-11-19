import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, ScanLine, Landmark, Cloud, BarChart3,
  MapPin, Droplets, FlaskConical, BookOpen, ShoppingCart, LogOut,
  Clock, Plane
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

interface AppSidebarProps {
  isMobile?: boolean;
  onClose?: () => void;
}

const AppSidebar = ({ isMobile = false, onClose }: AppSidebarProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const { t } = useLanguage();

  const handleLogout = async () => {
    onClose?.();
    await signOut();
    navigate("/auth/login");
  };

  const handleLinkClick = () => {
    if (isMobile && onClose) {
      onClose();
    }
  };

  const content = (
    <>
      <div className="flex-1 overflow-y-auto space-y-0.5 pr-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.to;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={handleLinkClick}
              className={`flex items-center gap-3 px-3.5 py-3 sm:py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? "bg-accent text-primary font-semibold shadow-2xs"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <item.icon className="w-4 h-4 shrink-0" />
              <span className="truncate">{t(item.label)}</span>
              {isActive && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-primary shrink-0" />}
            </NavLink>
          );
        })}
      </div>
      <div className="pt-3 border-t border-border mt-2">
        <Button
          variant="ghost"
          onClick={handleLogout}
          className="w-full justify-start gap-3 text-muted-foreground hover:text-destructive h-10 px-3.5"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          <span>{t("Logout")}</span>
        </Button>
      </div>
    </>
  );

  if (isMobile) {
    return <div className="flex flex-col h-full py-2">{content}</div>;
  }

  return (
    <aside className="hidden lg:flex w-52 min-h-[calc(100vh-3.5rem)] bg-card border-r border-border flex-col py-4 px-3 shrink-0">
      {content}
    </aside>
  );
};

export default AppSidebar;
