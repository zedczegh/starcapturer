import React from 'react';
import { useCountryFlag } from '@/hooks/useCountryFlag';
import { useLanguage } from '@/contexts/LanguageContext';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

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

  if (loading || !countryInfo) {
    return null;
  }

  const countryName = language === 'zh' && countryInfo.name_zh 
    ? countryInfo.name_zh 
    : countryInfo.name;

  if (showName) {
    return (
      <div className={`flex items-center gap-1.5 ${className}`}>
        <span className="text-xl leading-none">{countryInfo.flag}</span>
        <span className="text-xs text-muted-foreground">{countryName}</span>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span 
            className={`inline-flex items-center justify-center text-xl leading-none cursor-help ${className}`}
            role="img"
            aria-label={countryName}
          >
            {countryInfo.flag}
          </span>
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-sm font-medium">{countryName}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default CountryFlag;
