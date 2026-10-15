import { createContext, useContext, useState, ReactNode } from "react";

type Language = "en" | "hi";

interface LanguageContextType {
  language: Language;
  toggleLanguage: () => void;
  t: (en: string, hi: string) => string;
}

const LanguageContext = createContext<LanguageContextType>({
  language: "en",
  toggleLanguage: () => {},
  t: (en) => en,
});

export const useLanguage = () => useContext(LanguageContext);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguage] = useState<Language>(() => {
    const stored = localStorage.getItem("agri-language");
    return (stored === "hi" ? "hi" : "en") as Language;
  });

  const toggleLanguage = () => {
    setLanguage((l) => {
      const next = l === "en" ? "hi" : "en";
      localStorage.setItem("agri-language", next);
      return next;
    });
  };

  const t = (en: string, hi: string) => (language === "hi" ? hi : en);

  return (
    <LanguageContext.Provider value={{ language, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};
