
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
  compact?: boolean;
}

const LightPollutionIndicator: React.FC<LightPollutionIndicatorProps> = ({
  bortleScale,
  showDescription = true,
  size = 'md',
  showBortleNumber = true,
  className,
  compact = false
}) => {
  const { t, language } = useLanguage();
  
  // Get Bortle scale color
  const colorData = getBortleScaleColor(bortleScale);
  
  // Destructure color properties correctly
  const colorText = typeof colorData === 'string' ? colorData : colorData.text;
  const colorBg = typeof colorData === 'string' ? colorData : colorData.bg;
  const colorBorder = typeof colorData === 'string' ? colorData : colorData.border;
  
  // Enhanced size classes for more dynamic appearance
  const sizeClass = {
    sm: 'h-5 w-5 text-xs',
    md: 'h-6 w-6 text-sm',
    lg: 'h-7 w-7 text-base'
  }[size];
  
  const description = getBortleScaleDescription(bortleScale);
  
  // Format Bortle scale for display (keep one decimal place if needed)
  const formatBortleScale = (value: number) => {
    return Number.isInteger(value) ? value.toString() : value.toFixed(1);
  };

  // Compact mode for sidebar widgets - with larger font
  if (compact) {
    return (
      <div className={cn("flex items-center", className)}>
        <div className="flex items-center">
          <div 
            className={cn(
              "rounded-full mr-2 flex items-center justify-center border shadow-sm", 
              "h-5 w-5",
              colorBg,
              colorBorder
            )}
          >
            <span className={cn("font-bold text-[0.8em]", colorText)}>
              {formatBortleScale(bortleScale)}
            </span>
          </div>
          <span className="text-sm font-medium">
            {t("Bortle", "波特尔")}
          </span>
        </div>
      </div>
    );
  }
  
  return (
    <div className={cn("flex items-center", className)}>
      <div 
        className={cn(
          "rounded-full mr-2.5 flex items-center justify-center border shadow-sm", 
          sizeClass,
          colorBg,
          colorBorder
        )}
      >
        {showBortleNumber && (
          <span className={cn("font-bold", colorText)}>
            {formatBortleScale(bortleScale)}
          </span>
        )}
      </div>
      
      {showDescription && (
        <span className="text-sm font-medium text-muted-foreground">
          {t(description, language === 'en' ? description : getBortleScaleDescription(bortleScale, 'zh'))}
        </span>
      )}
    </div>
  );
};

export default LightPollutionIndicator;
