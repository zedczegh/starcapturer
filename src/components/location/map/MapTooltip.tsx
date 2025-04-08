
import React from 'react';
import { Popup } from 'react-leaflet';
import { useLanguage } from '@/contexts/LanguageContext';

interface MapTooltipProps {
  name: string;
  children?: React.ReactNode;
  className?: string;
}

/**
 * Enhanced map tooltip component with better styling and performance
 * Removed position prop as it's not needed when used as a child of Marker
 */
const MapTooltip: React.FC<MapTooltipProps> = ({ 
  name, 
  children,
  className = ''
}) => {
  const { t } = useLanguage();
  
  return (
    <Popup
      closeOnClick={false}
      autoClose={false}
      // The className needs to be applied to the inner div instead of Popup
    >
      <div className={`map-tooltip p-2 leaflet-popup-custom marker-popup-gradient ${className}`}>
        <div className="font-medium text-sm">{name}</div>
        {children}
      </div>
    </Popup>
  );
};

export default MapTooltip;
