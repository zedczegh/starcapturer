import React from 'react';
import { MapPin, Lightbulb } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import { getBortleScaleColor } from '@/data/utils/bortleScaleUtils';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

interface LocationInfoProps {
  location: SharedAstroSpot;
  certInfo: any;
  displayName: string;
  language: string;
  showBortleScale?: boolean;
}

const LocationInfo: React.FC<LocationInfoProps> = ({ 
  location, 
  certInfo, 
  displayName, 
  language,
  showBortleScale = true
}) => {
  const { t } = useLanguage();

  return (
    <div className="space-y-1.5 mb-3">
      {/* Certification badge */}
      {certInfo && (
        <div className="flex items-center">
          <Badge 
            variant="outline" 
            className={`${certInfo.color} text-xs px-2 py-1 flex items-center gap-1.5`}
          >
            {React.createElement(certInfo.icon, { className: "h-3.5 w-3.5" })}
            <span>{certInfo.language === 'en' ? certInfo.label : certInfo.labelChinese}</span>
          </Badge>
        </div>
      )}

      {/* Bortle scale information - only if showBortleScale is true */}
      {showBortleScale && location.bortleScale && (() => {
        const colorData = getBortleScaleColor(location.bortleScale);
        return (
          <div className="flex items-center gap-1.5">
            <Lightbulb className="h-3.5 w-3.5 text-muted-foreground" />
            <div 
              className={cn(
                "rounded-full px-2 py-0.5 flex items-center justify-center border",
                colorData.bg,
                colorData.border
              )}
            >
              <span className={cn("text-xs font-semibold", colorData.text)}>
                {location.bortleScale}
              </span>
            </div>
          </div>
        );
      })()}
    </div>
  );
};

export default LocationInfo;
