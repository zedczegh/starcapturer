
import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';

type Language = 'en' | 'zh';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (en: string, zh: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Store language preference in localStorage
const LANGUAGE_STORAGE_KEY = 'app-language-preference';

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Initialize with stored preference or default to browser language
  const getInitialLanguage = (): Language => {
    const storedLanguage = localStorage.getItem(LANGUAGE_STORAGE_KEY) as Language;
    if (storedLanguage === 'en' || storedLanguage === 'zh') {
      return storedLanguage;
    }
    
    // Try to detect browser language
    const browserLanguage = navigator.language.toLowerCase();
    if (browserLanguage.startsWith('zh')) {
      return 'zh';
    }
    
    return 'en';
  };

  const [language, setLanguageState] = useState<Language>(getInitialLanguage);

  // Update localStorage when language changes
  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
    // Add a custom event to notify all components about language change
    window.dispatchEvent(new CustomEvent('language-changed', { detail: { language: lang } }));
  };

  // Simple translation function
  const t = (en: string, zh: string): string => {
    return language === 'en' ? en : zh;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
