
import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback, useMemo } from 'react';

// Export the Language type so other modules can use it
export type Language = 'en' | 'zh';

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
    if (typeof window === 'undefined') return 'en'; // SSR safety check
    
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

  // Memoize the setLanguage function to avoid unnecessary re-renders
  const setLanguage = useCallback((lang: Language) => {
    if (typeof window === 'undefined') return; // SSR safety check
    
    setLanguageState(lang);
    localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
    // Add a custom event to notify all components about language change
    window.dispatchEvent(new CustomEvent('language-changed', { detail: { language: lang } }));
  }, []);

  // Optimize language change event handling
  useEffect(() => {
    if (typeof window === 'undefined') return; // SSR safety check
    
    const handleLanguageChange = (event: Event) => {
      const customEvent = event as CustomEvent;
      const newLang = customEvent.detail?.language;
      if (newLang && (newLang === 'en' || newLang === 'zh')) {
        setLanguageState(newLang);
      }
    };

    window.addEventListener('language-changed', handleLanguageChange);
    return () => {
      window.removeEventListener('language-changed', handleLanguageChange);
    };
  }, []);

  // Memoize the translation function to prevent unnecessary re-renders
  const t = useCallback((en: string, zh: string): string => {
    return language === 'en' ? en : zh;
  }, [language]);

  // Memoize the context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({
    language,
    setLanguage,
    t
  }), [language, setLanguage, t]);

  return (
    <LanguageContext.Provider value={contextValue}>
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
