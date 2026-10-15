import { ReactNode } from "react";
import AppSidebar from "./AppSidebar";
import { Globe, Moon, Sun } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";
import { useLanguage } from "@/hooks/useLanguage";
import NotificationDropdown from "./NotificationDropdown";
import UserDropdown from "./UserDropdown";

const AppLayout = ({ children }: { children: ReactNode }) => {
  const { theme, toggleTheme } = useTheme();
  const { language, toggleLanguage } = useLanguage();

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top bar */}
      <header className="h-14 bg-card border-b border-border flex items-center justify-between px-6 shrink-0 z-10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full agri-gradient flex items-center justify-center">
            <span className="text-sm font-bold text-primary-foreground">A</span>
          </div>
          <div>
            <h1 className="text-sm font-display font-bold text-foreground leading-none">AgriAssist</h1>
            <p className="text-[10px] text-muted-foreground">Smart Farming</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={toggleLanguage} 
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border bg-muted/60 hover:bg-muted text-xs font-medium transition-all shadow-xs"
            title="Switch Language / భాష మార్చండి"
          >
            <Globe className="w-3.5 h-3.5 text-primary" />
            <span className={language === "en" ? "font-bold text-primary" : "text-muted-foreground"}>English</span>
            <span className="text-muted-foreground/40">|</span>
            <span className={language === "te" ? "font-bold text-primary" : "text-muted-foreground"}>తెలుగు</span>
          </button>
          <button onClick={toggleTheme} className="p-2 rounded-lg hover:bg-muted text-muted-foreground">
            {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
          <NotificationDropdown />
          <UserDropdown />
        </div>
      </header>

      <div className="flex flex-1">
        <AppSidebar />
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
