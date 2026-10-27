import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export type Language = "en" | "te";

export interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  isTelugu: boolean;
  t: (keyOrEn: string, teFallback?: string) => string;
}

// Built-in English to Telugu Dictionary for UI strings
const DICTIONARY: Record<string, string> = {
  // Navigation & Sidebars
  "Dashboard": "డ్యాష్‌బోర్డ్",
  "Weather": "వాతావరణం",
  "Crop Scanner": "పంట వ్యాధి స్కానర్",
  "Crop Guidance": "పంట సలహాలు",
  "Irrigation": "నీటిపారుదల సలహాలు",
  "Drone & Spray": "డ్రోన్ & స్ప్రే బుకింగ్",
  "Demand & Supply": "డిమాండ్ & సరఫరా",
  "Regional Insights": "ప్రాంతీయ సమాచారం",
  "Govt Schemes": "ప్రభుత్వ పథకాలు",
  "AI Chatbot": "రైతు AI సహాయకుడు",
  "Orders": "ఆర్డర్లు",
  "AgriChrono™": "అగ్రి క్రోనో™",
  "Farmers": "రైతుల డైరెక్టరీ",
  "Agri Market": "వ్యవసాయ మార్కెట్",
  "Marketplace": "మార్కెట్‌ప్లేస్",
  "Demand & Trends": "డిమాండ్ & ట్రెండ్స్",
  "Bulk Orders": "బల్క్ ఆర్డర్లు",
  "Spray Operator": "స్ప్రే ఆపరేటర్",
  "Traceability": "పంట ట్రేసిబిలిటీ",
  "My Orders": "నా ఆర్డర్లు",
  "Profile": "ప్రొఫైల్",
  
  // Header & Auth
  "AgriAssist": "అగ్రి అసిస్ట్",
  "Smart Farming": "స్మార్ట్ వ్యవసాయం",
  "AgriAssist Consumer": "అగ్రి అసిస్ట్ వినియోగదారుడు",
  "Smart Marketplace": "స్మార్ట్ మార్కెట్‌ప్లేస్",
  "Logout": "లాగ్ అవుట్",
  "Login": "లాగిన్",
  "Sign In": "లాగిన్ అవ్వండి",
  "Sign Up": "రిజిస్టర్ చేసుకోండి",
  "Register": "రిజిస్ట్రేషన్",
  "Welcome back": "స్వాగతం",
  
  // Actions & Buttons
  "Search": "వెతకండి",
  "Submit": "సబ్మిట్ చేయండి",
  "Cancel": "రద్దు చేయండి",
  "Save": "సేవ్ చేయండి",
  "Edit": "మార్చు",
  "Accept": "ఆమోదించండి",
  "Reject": "తిరస్కరించండి",
  "View": "చూడండి",
  "Loading...": "లోడ్ అవుతోంది...",
  
  // Statuses
  "Pending": "పెండింగ్‌లో ఉంది",
  "Accepted": "ఆమోదించబడింది",
  "Packed": "ప్యాక్ చేయబడింది",
  "Out for Delivery": "డెలివరీలో ఉంది",
  "Delivered": "డెలివరీ పూర్తయింది",
  "Cancelled": "రద్దు చేయబడింది",
  
  // Common terms
  "Farmer": "రైతు",
  "Consumer": "వినియోగదారుడు",
  "Price": "ధర",
  "Yield": "దిగుబడి",
  "Quantity": "పరిమాణం",
  "Total": "మొత్తం",
  "Rice": "వరి",
  "Wheat": "గోధుమ",
  "Cotton": "పత్తి",
  "Maize": "మొక్కజొన్న",
  "Sugarcane": "చెరకు",
  "Andhra Pradesh": "ఆంధ్రప్రదేశ్",
  "Telangana": "తెలంగాణ",
};

const LanguageContext = createContext<LanguageContextType>({
  language: "en",
  setLanguage: () => {},
  toggleLanguage: () => {},
  isTelugu: false,
  t: (keyOrEn, teFallback) => teFallback || keyOrEn,
});

export const useLanguage = () => useContext(LanguageContext);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("agri-language");
      if (stored === "te" || stored === "en") return stored as Language;
    }
    return "en";
  });

  const isTelugu = language === "te";

  // Google Translate Helper for full DOM dynamic text translation
  const triggerGoogleTranslate = (lang: Language) => {
    if (typeof window === "undefined") return;

    try {
      const targetCode = lang === "te" ? "/en/te" : "/en/en";
      document.cookie = `googtrans=${targetCode}; path=/;`;
      document.cookie = `googtrans=${targetCode}; path=/; domain=${window.location.hostname};`;

      const combo = document.querySelector(".goog-te-combo") as HTMLSelectElement | null;
      if (combo) {
        combo.value = lang;
        combo.dispatchEvent(new Event("change"));
      } else if (lang === "te") {
        if (!document.getElementById("google-translate-script")) {
          const script = document.createElement("script");
          script.id = "google-translate-script";
          script.src = "//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
          document.body.appendChild(script);

          (window as any).googleTranslateElementInit = () => {
            new (window as any).google.translate.TranslateElement(
              { pageLanguage: "en", includedLanguages: "en,te", autoDisplay: false },
              "google_translate_element"
            );
            setTimeout(() => {
              const c = document.querySelector(".goog-te-combo") as HTMLSelectElement | null;
              if (c) {
                c.value = "te";
                c.dispatchEvent(new Event("change"));
              }
            }, 600);
          };
        }
      } else {
        // Switching back to English
        const c = document.querySelector(".goog-te-combo") as HTMLSelectElement | null;
        if (c) {
          c.value = "en";
          c.dispatchEvent(new Event("change"));
        }
      }
    } catch (e) {
      console.warn("Language translation error:", e);
    }
  };

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    if (typeof window !== "undefined") {
      localStorage.setItem("agri-language", lang);
      document.documentElement.lang = lang;
      triggerGoogleTranslate(lang);
    }
  };

  const toggleLanguage = () => {
    const next = language === "en" ? "te" : "en";
    setLanguage(next);
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      document.documentElement.lang = language;
      if (language === "te") {
        triggerGoogleTranslate("te");
      }
    }
  }, []);

  const t = (keyOrEn: string, teFallback?: string): string => {
    if (language !== "te") return keyOrEn;
    if (teFallback) return teFallback;
    return DICTIONARY[keyOrEn] || keyOrEn;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, toggleLanguage, isTelugu, t }}>
      <div id="google_translate_element" style={{ display: "none" }} />
      {children}
    </LanguageContext.Provider>
  );
};
