import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, Store, TrendingUp, Package,
  ShieldCheck, ShoppingCart, User, Users, Wheat, LogOut, Plane
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";
import { Button } from "@/components/ui/button";

const navItems = [
  { to: "/consumer/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/consumer/farmers", label: "Farmers", icon: Users },
  { to: "/consumer/market", label: "Agri Market", icon: Wheat },
  { to: "/consumer/marketplace", label: "Marketplace", icon: Store },
  { to: "/consumer/demand", label: "Demand & Trends", icon: TrendingUp },
  { to: "/consumer/bulk", label: "Bulk Orders", icon: Package },
  { to: "/consumer/spray-bookings", label: "Spray Operator", icon: Plane },
  { to: "/consumer/traceability", label: "Traceability", icon: ShieldCheck },
  { to: "/consumer/orders", label: "My Orders", icon: ShoppingCart },
  { to: "/consumer/profile", label: "Profile", icon: User },
];

interface ConsumerSidebarProps {
  isMobile?: boolean;
  onClose?: () => void;
}

const ConsumerSidebar = ({ isMobile = false, onClose }: ConsumerSidebarProps) => {
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
                  ? "bg-accent text-foreground font-semibold shadow-2xs"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <item.icon className="w-4 h-4 shrink-0" />
              <span className="truncate">{t(item.label)}</span>
              {isActive && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-foreground shrink-0" />}
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

export default ConsumerSidebar;
