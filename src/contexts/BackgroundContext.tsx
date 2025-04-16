
import React, { createContext, useContext, useState, ReactNode } from 'react';
import { COSMIC_NEBULA_BG, STAR_FIELD_BG, DEEP_SPACE_BG } from '@/assets/index';

// Define available background options
export const backgroundOptions = [
  { id: 'cosmic', name: 'Cosmic Nebula', src: COSMIC_NEBULA_BG },
  { id: 'stars', name: 'Star Field', src: STAR_FIELD_BG },
  { id: 'deep', name: 'Deep Space', src: DEEP_SPACE_BG },
];

type BackgroundContextType = {
  currentBackground: string;
  setBackground: (src: string) => void;
  backgroundOptions: Array<{id: string, name: string, src: string}>;
};

const BackgroundContext = createContext<BackgroundContextType | undefined>(undefined);

export const BackgroundProvider = ({ children }: { children: ReactNode }) => {
  const [currentBackground, setCurrentBackground] = useState<string>(COSMIC_NEBULA_BG);
  
  const setBackground = (src: string) => {
    setCurrentBackground(src);
    try {
      localStorage.setItem('preferred_background', src);
    } catch (e) {
      console.error('Could not save background preference to localStorage', e);
    }
  };
  
  // Check for saved background preference on init
  React.useEffect(() => {
    try {
      const savedBackground = localStorage.getItem('preferred_background');
      if (savedBackground) {
        setCurrentBackground(savedBackground);
      }
    } catch (e) {
      console.error('Could not retrieve background from localStorage', e);
    }
  }, []);
  
  return (
    <BackgroundContext.Provider value={{ 
      currentBackground, 
      setBackground,
      backgroundOptions
    }}>
      {children}
    </BackgroundContext.Provider>
  );
};

export const useBackground = () => {
  const context = useContext(BackgroundContext);
  if (context === undefined) {
    throw new Error('useBackground must be used within a BackgroundProvider');
  }
  return context;
};
