
import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Sparkles } from 'lucide-react';

interface AstronomyTipProps {
  tip: [string, string] | null;
}

const AstronomyTip: React.FC<AstronomyTipProps> = ({ tip }) => {
  const { language } = useLanguage();
  
  if (!tip) return null;
  
  const displayTip = language === 'zh' ? tip[1] : tip[0];
  
  return (
    <div className="bg-gradient-to-r from-cosmic-800/70 to-cosmic-900/60 rounded-lg p-4 mt-4 border border-cosmic-700/30 backdrop-blur-sm">
      <div className="flex items-start">
        <Sparkles className="w-5 h-5 text-primary mr-2 flex-shrink-0 mt-1" />
        <p className="text-cosmic-200 text-sm italic">
          {displayTip}
        </p>
      </div>
    </div>
  );
};

export default AstronomyTip;
