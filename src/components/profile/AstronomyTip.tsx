
import React, { useEffect, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Star } from 'lucide-react';

// Define the props interface
interface AstronomyTipProps {
  tip: [string, string] | null;
}

const AstronomyTip: React.FC<AstronomyTipProps> = ({ tip }) => {
  const { language } = useLanguage();
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    // Start animation when the component mounts or tip changes
    setAnimate(true);
    // Reset animation state for potential future tip changes
    const timer = setTimeout(() => setAnimate(false), 500);
    return () => clearTimeout(timer);
  }, [tip]);
  
  if (!tip) return null;
  
  // Display the appropriate language version
  const displayTip = language === 'zh' ? tip[1] : tip[0];
  
  return (
    <div className={`mt-4 bg-gradient-to-r from-cosmic-900/80 to-cosmic-800/60 rounded-xl px-5 py-4 shadow-glow border border-primary/20 transition-all duration-300 ${animate ? 'animate-fade-scale' : ''}`}>
      <div className="flex items-start gap-3">
        <div className="mt-0.5">
          <Star className="h-5 w-5 text-primary animate-pulse" />
        </div>
        <p className="text-cosmic-100 font-medium leading-relaxed">
          {displayTip}
        </p>
      </div>
    </div>
  );
};

export default AstronomyTip;
