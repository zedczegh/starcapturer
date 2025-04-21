
import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';

// Define the props interface
interface AstronomyTipProps {
  tip: [string, string] | null;
}

const AstronomyTip: React.FC<AstronomyTipProps> = ({ tip }) => {
  const { language } = useLanguage();
  
  if (!tip) return null;
  
  // Display the appropriate language version
  const displayTip = language === 'zh' ? tip[1] : tip[0];
  
  return (
    <div className="mt-3 text-cosmic-100 bg-primary/10 border-l-4 border-primary/60 rounded px-4 py-2 font-medium shadow animate-fade-in">
      <span className="text-primary font-semibold mr-2">★</span>
      {displayTip}
    </div>
  );
};

export default AstronomyTip;
