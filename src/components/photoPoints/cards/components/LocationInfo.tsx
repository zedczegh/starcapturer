
import React from 'react';
import { MapPin, Star } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import { getBortleDescription } from '@/utils/weather/bortleScaleUtils';
import { useLanguage } from '@/contexts/LanguageContext';

interface LocationInfoProps {
  location: SharedAstroSpot;
  certInfo: any;
  displayName: string;
  language: string;
  showBortleScale?: boolean;
  isMobile?: boolean;
}

const LocationInfo: React.FC<LocationInfoProps> = ({ 
  location, 
  certInfo, 
  displayName, 
  language,
  showBortleScale = true,
  isMobile = false
}) => {
  const { t } = useLanguage();

  return (
    <div className="space-y-1.5 mb-3">
      {/* Certification badge - optimized with conditional rendering */}
      {certInfo && (
        <div className="flex items-center">
          <Badge 
            variant="outline" 
            className={`${certInfo.color} text-xs px-2 py-0.5 flex items-center gap-1.5`}
          >
            {React.createElement(certInfo.icon, { 
              className: `${isMobile ? 'h-3 w-3' : 'h-3.5 w-3.5'}` 
            })}
            <span>{certInfo.language === 'en' ? certInfo.label : certInfo.labelChinese}</span>
          </Badge>
        </div>
      )}

      {/* Bortle scale information - optimized with conditional rendering */}
      {showBortleScale && location.bortleScale && (
        <div className="flex items-center text-muted-foreground">
          <Star className={`${isMobile ? 'h-3 w-3' : 'h-3.5 w-3.5'} mr-1.5`} />
          <span className="text-xs">
            {t("Bortle", "波尔特")}: {location.bortleScale} - {getBortleDescription(location.bortleScale, t)}
          </span>
        </div>
      )}
    </div>
  );
};

export default React.memo(LocationInfo);
