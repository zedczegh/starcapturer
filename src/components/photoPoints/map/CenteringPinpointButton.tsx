
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
  className = "absolute top-4 right-4 z-[999]"  // Default position to top-right corner
}) => {
  const { t } = useLanguage();
  
  return (
    <div className={className}>
      <PinpointButton 
        onGetLocation={onGetLocation}
        shouldCenter={true} 
      />
    </div>
  );
};

export default CenteringPinpointButton;
