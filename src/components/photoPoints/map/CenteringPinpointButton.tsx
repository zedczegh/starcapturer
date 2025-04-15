
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
  className = "absolute bottom-4 right-12 z-[999]"  // Moved from right-8 to right-12 for better alignment
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
