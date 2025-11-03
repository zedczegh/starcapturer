import React from 'react';
import { useCountryFlag } from '@/hooks/useCountryFlag';
import { useLanguage } from '@/contexts/LanguageContext';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Globe } from 'lucide-react';

interface CountryFlagProps {
  latitude?: number;
  longitude?: number;
  className?: string;
  showName?: boolean;
}

const CountryFlag: React.FC<CountryFlagProps> = ({ 
  latitude, 
  longitude, 
  className = '',
  showName = false 
}) => {
  const { countryInfo, loading } = useCountryFlag(latitude, longitude);
  const { language } = useLanguage();

  // Show a placeholder while loading
  if (loading) {
    return (
      <span className={`inline-flex items-center justify-center ${className}`}>
        <Globe className="h-4 w-4 text-muted-foreground/50 animate-pulse" />
      </span>
    );
  }

  if (!countryInfo) {
    return null;
  }

  const countryName = language === 'zh' && countryInfo.name_zh 
    ? countryInfo.name_zh 
    : countryInfo.name;

  if (showName) {
    return (
      <div className={`flex items-center gap-1.5 ${className}`}>
        <span className="text-2xl leading-none" style={{ fontSize: '1.5rem' }}>{countryInfo.flag}</span>
        <span className="text-xs text-muted-foreground font-medium">{countryName}</span>
      </div>
    );
  }

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span 
            className={`inline-flex items-center justify-center cursor-help transition-transform hover:scale-110 ${className}`}
            role="img"
            aria-label={countryName}
            style={{ fontSize: '1.5rem', lineHeight: 1 }}
          >
            {countryInfo.flag}
          </span>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="bg-cosmic-800 border-cosmic-700">
          <p className="text-sm font-medium text-white">{countryName}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default React.memo(CountryFlag);
