
import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import PinpointButton from './PinpointButton';

interface CenteringPinpointButtonProps {
  onGetLocation: () => void;
  userLocation: { latitude: number, longitude: number } | null;
  className?: string;
}

const CenteringPinpointButton: React.FC<CenteringPinpointButtonProps> = ({ 
  onGetLocation, 
  userLocation,
  className = "absolute top-4 right-16 z-[999]"  // Positioned at top-right, aligned with legend
}) => {
  const { t } = useLanguage();
  
  return (
    <div className={className}>
      <PinpointButton 
        onGetLocation={onGetLocation}
        shouldCenter={false}
      />
    </div>
  );
};

export default CenteringPinpointButton;
