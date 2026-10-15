import { ReactNode } from "react";
import ConsumerSidebar from "./ConsumerSidebar";
import { Globe, Moon, Sun } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";
import { useLanguage } from "@/hooks/useLanguage";
import NotificationDropdown from "./NotificationDropdown";
import UserDropdown from "./UserDropdown";

const ConsumerLayout = ({ children }: { children: ReactNode }) => {
  const { theme, toggleTheme } = useTheme();
  const { language, toggleLanguage } = useLanguage();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="h-14 bg-card border-b border-border flex items-center justify-between px-6 shrink-0 z-10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-foreground flex items-center justify-center">
            <span className="text-sm font-bold text-background">A</span>
          </div>
          <div>
            <h1 className="text-sm font-display font-bold text-foreground leading-none">AgriAssist Consumer</h1>
            <p className="text-[10px] text-muted-foreground">Smart Marketplace</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={toggleLanguage} className="p-2 rounded-lg hover:bg-muted text-muted-foreground">
            <Globe className="w-4 h-4" />
          </button>
          <button onClick={toggleTheme} className="p-2 rounded-lg hover:bg-muted text-muted-foreground">
            {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
          <NotificationDropdown />
          <UserDropdown />
        </div>
      </header>
      <div className="flex flex-1">
        <ConsumerSidebar />
        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
    </div>
  );
};

export default ConsumerLayout;
