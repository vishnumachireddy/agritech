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

const ConsumerSidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const { t } = useLanguage();

  const handleLogout = async () => {
    await signOut();
    navigate("/auth/login");
  };

  return (
    <aside className="w-[200px] min-h-full bg-card border-r border-border flex flex-col py-4 px-3 shrink-0">
      <div className="flex-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.to;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors mb-0.5 ${
                isActive
                  ? "bg-accent text-foreground font-semibold"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <item.icon className="w-4 h-4" />
              {t(item.label)}
              {isActive && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-foreground" />}
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

export default ConsumerSidebar;
