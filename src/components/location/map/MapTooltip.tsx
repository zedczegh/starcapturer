
import React from 'react';
import { Popup } from 'react-leaflet';
import { useLanguage } from '@/contexts/LanguageContext';

interface MapTooltipProps {
  name: string;
  position: [number, number];
  children?: React.ReactNode;
  className?: string;
}

/**
 * Enhanced map tooltip component with better styling and performance
 */
const MapTooltip: React.FC<MapTooltipProps> = ({ 
  name, 
  position,
  children,
  className = ''
}) => {
  const { t } = useLanguage();
  
  return (
    <Popup
      position={position}
      closeOnClick={false}
      autoClose={false}
      className={`map-tooltip ${className}`}
    >
      <div className="p-2 leaflet-popup-custom marker-popup-gradient">
        <div className="font-medium text-sm">{name}</div>
        {children}
      </div>
    </Popup>
  );
};

export default MapTooltip;
