import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { getBortleScaleDescription, getBortleScaleColor } from '@/data/utils/bortleScaleUtils';
import { cn } from '@/lib/utils';

interface LightPollutionIndicatorProps {
  bortleScale: number;
  showDescription?: boolean;
  size?: 'sm' | 'md' | 'lg';
  showBortleNumber?: boolean;
  className?: string;
}

const LightPollutionIndicator: React.FC<LightPollutionIndicatorProps> = ({
  bortleScale,
  showDescription = true,
  size = 'md',
  showBortleNumber = true,
  className
}) => {
  const { t, language } = useLanguage();
  
  // Get Bortle scale color
  const colorData = getBortleScaleColor(bortleScale);
  
  // Destructure color properties correctly
  const colorText = typeof colorData === 'string' ? colorData : colorData.text;
  const colorBg = typeof colorData === 'string' ? colorData : colorData.bg;
  const colorBorder = typeof colorData === 'string' ? colorData : colorData.border;
  
  // Get size class
  const sizeClass = {
    sm: 'h-3 w-3 text-xs',
    md: 'h-4 w-4 text-sm',
    lg: 'h-5 w-5 text-base'
  }[size];
  
  const description = getBortleScaleDescription(bortleScale);
  
  // Format Bortle scale for display (keep one decimal place if needed)
  const formatBortleScale = (value: number) => {
    return Number.isInteger(value) ? value.toString() : value.toFixed(1);
  };
  
  return (
    <div className={cn("flex items-center", className)}>
      <div 
        className={cn(
          "rounded-full mr-2 flex items-center justify-center border", 
          sizeClass,
          colorBg,
          colorBorder
        )}
      >
        {showBortleNumber && (
          <span className={cn("font-semibold text-[0.65em]", colorText)}>
            {formatBortleScale(bortleScale)}
          </span>
        )}
      </div>
      
      {showDescription && (
        <span className="text-sm text-muted-foreground">
          {t(description, language === 'en' ? description : getBortleScaleDescription(bortleScale, 'zh'))}
        </span>
      )}
    </div>
  );
};

export default LightPollutionIndicator;
