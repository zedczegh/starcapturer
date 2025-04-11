
import React from 'react';
import { Popup } from 'react-leaflet';
import { useLanguage } from '@/contexts/LanguageContext';
import { Badge } from '@/components/ui/badge';
import { Star, Award, Info } from 'lucide-react';

interface MapTooltipProps {
  name: string;
  children?: React.ReactNode;
  className?: string;
  certification?: string;
  isDarkSkyReserve?: boolean;
}

/**
 * Enhanced map tooltip component with better styling and positioning
 */
const MapTooltip: React.FC<MapTooltipProps> = ({ 
  name, 
  children,
  className = '',
  certification,
  isDarkSkyReserve
}) => {
  const { t } = useLanguage();
  
  // Determine if this is a certified location
  const isCertified = Boolean(isDarkSkyReserve || certification);
  
  return (
    <Popup
      closeOnClick={false}
      autoClose={false}
      className="custom-popup"
    >
      <div className={`map-tooltip p-3 leaflet-popup-custom marker-popup-gradient ${className}`}>
        <div className="flex items-center gap-1.5 mb-1.5">
          {isCertified && <Star className="h-3.5 w-3.5 text-yellow-400 fill-yellow-400" />}
          <div className="font-medium text-sm text-gray-100">{name}</div>
        </div>
        
        {isCertified && certification && (
          <div className="mb-2">
            <Badge variant="outline" className="bg-primary/10 border-primary/30 text-primary-foreground text-xs flex items-center gap-1">
              <Award className="h-3 w-3" />
              <span>{certification}</span>
            </Badge>
          </div>
        )}
        
        {children}
      </div>
    </Popup>
  );
};

export default MapTooltip;
