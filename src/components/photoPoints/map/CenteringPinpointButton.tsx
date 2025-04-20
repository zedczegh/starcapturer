
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
  className = "absolute bottom-4 right-4 z-[999]"  // Positioned at bottom-right
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
