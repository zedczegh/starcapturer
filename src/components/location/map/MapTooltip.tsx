
import React from 'react';
import { Popup } from 'react-leaflet';
import { useLanguage } from '@/contexts/LanguageContext';

interface MapTooltipProps {
  name: string;
  children?: React.ReactNode;
  className?: string;
}

/**
 * Enhanced map tooltip component with better styling and positioning
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
      maxWidth={250}
      autoPan={true}
      className="custom-popup"
    >
      <div className={`map-tooltip p-2 leaflet-popup-custom marker-popup-gradient ${className}`}>
        <div className="font-medium text-sm">{name}</div>
        {children}
      </div>
    </Popup>
  );
};

export default MapTooltip;
