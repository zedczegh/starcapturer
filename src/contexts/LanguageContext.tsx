
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';

type Language = 'en' | 'zh';

interface Translations {
  [key: string]: string;
}

interface LanguageContextType {
  language: Language;
  t: (english: string, chinese: string) => string;
  setLanguage: (lang: Language) => void;
  changeLanguage: (lang: Language) => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>(() => {
    // Try to get the language from localStorage
    if (typeof window !== 'undefined') {
      const savedLanguage = localStorage.getItem('language') as Language;
      if (savedLanguage === 'en' || savedLanguage === 'zh') {
        return savedLanguage;
      }
      
      // Try to detect browser language
      const browserLang = navigator.language.toLowerCase();
      if (browserLang.startsWith('zh')) {
        return 'zh';
      }
    }
    return 'en';
  });
  
  // Translation function
  const t = (english: string, chinese: string): string => {
    return language === 'zh' ? chinese : english;
  };

  const changeLanguage = (lang: Language) => {
    setLanguage(lang);
  };
  
  useEffect(() => {
    // Save language preference to localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('language', language);
      
      // Update html lang attribute
      document.documentElement.lang = language;
    }
  }, [language]);

  return (
    <LanguageContext.Provider value={{ language, t, setLanguage, changeLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
