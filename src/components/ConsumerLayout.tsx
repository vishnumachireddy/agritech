import { ReactNode, useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import ConsumerSidebar from "./ConsumerSidebar";
import { Globe, Moon, Sun, Menu } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";
import { useLanguage } from "@/hooks/useLanguage";
import NotificationDropdown from "./NotificationDropdown";
import UserDropdown from "./UserDropdown";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

const ConsumerLayout = ({ children }: { children: ReactNode }) => {
  const { theme, toggleTheme } = useTheme();
  const { language, toggleLanguage } = useLanguage();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  // Close mobile drawer when route changes
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Top Header */}
      <header className="h-14 bg-card border-b border-border flex items-center justify-between px-3 sm:px-6 shrink-0 z-20 sticky top-0">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          {/* Mobile hamburger button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            aria-label="Open Navigation Menu"
            className="lg:hidden p-2 -ml-1 rounded-lg text-foreground hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary touch-target flex items-center justify-center"
          >
            <Menu className="w-5 h-5 text-foreground" />
          </button>

          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 rounded-full bg-foreground flex items-center justify-center shrink-0">
              <span className="text-sm font-bold text-background">A</span>
            </div>
            <div className="truncate">
              <h1 className="text-sm font-display font-bold text-foreground leading-none truncate">AgriAssist Consumer</h1>
              <p className="text-[10px] text-muted-foreground truncate hidden xs:block">Smart Marketplace</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          {/* Language Toggle with adaptive sizing */}
          <button 
            type="button"
            onClick={toggleLanguage} 
            className="flex items-center gap-1 px-2 sm:px-3 py-1.5 rounded-full border border-border bg-muted/60 hover:bg-muted text-xs font-medium transition-all shadow-2xs h-8 sm:h-9"
            title="Switch Language / భాష మార్చండి"
          >
            <Globe className="w-3.5 h-3.5 text-foreground shrink-0" />
            <span className="hidden sm:inline">
              <span className={language === "en" ? "font-bold text-foreground" : "text-muted-foreground"}>English</span>
              <span className="text-muted-foreground/40 mx-1">|</span>
              <span className={language === "te" ? "font-bold text-foreground" : "text-muted-foreground"}>తెలుగు</span>
            </span>
            <span className="sm:hidden font-semibold text-[11px] text-foreground">
              {language === "en" ? "EN" : "తె"}
            </span>
          </button>

          {/* Theme Toggle */}
          <button 
            type="button"
            onClick={toggleTheme} 
            aria-label="Toggle Dark/Light Mode"
            className="p-2 rounded-lg hover:bg-muted text-muted-foreground h-8 w-8 sm:h-9 sm:w-9 flex items-center justify-center transition-colors"
          >
            {theme === "dark" ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
          </button>

          <NotificationDropdown />
          <UserDropdown />
        </div>
      </header>

      {/* Mobile Navigation Drawer Sheet */}
      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetContent side="left" className="w-[280px] sm:w-[320px] p-4 flex flex-col z-50">
          <SheetHeader className="pb-3 border-b border-border text-left">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-foreground flex items-center justify-center shrink-0">
                <span className="text-sm font-bold text-background">A</span>
              </div>
              <div>
                <SheetTitle className="text-base font-display font-bold text-foreground leading-tight">AgriAssist Consumer</SheetTitle>
                <p className="text-[11px] text-muted-foreground">Smart Marketplace Portal</p>
              </div>
            </div>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto pt-2">
            <ConsumerSidebar isMobile={true} onClose={() => setMobileMenuOpen(false)} />
          </div>
        </SheetContent>
      </Sheet>

      {/* Main Body with persistent desktop sidebar */}
      <div className="flex flex-1 min-w-0">
        <ConsumerSidebar />
        <main className="flex-1 min-w-0 overflow-y-auto overflow-x-hidden p-3 sm:p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default ConsumerLayout;
