
import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import PinpointButton from './PinpointButton';

interface CenteringPinpointButtonProps {
  onGetLocation: () => void;
  userLocation: { latitude: number; longitude: number } | null;
  className?: string;
}

const CenteringPinpointButton: React.FC<CenteringPinpointButtonProps> = ({ 
  onGetLocation, 
  userLocation,
  className = "absolute bottom-4 right-4 z-[999]"  // Positioned at bottom-right
}) => {
  const { t } = useLanguage();
  
  // Create a handler that will be called when the button is clicked
  const handlePinpointClick = () => {
    console.log("Pinpoint button clicked, getting user location");
    onGetLocation();
  };
  
  return (
    <div className={className}>
      <PinpointButton 
        onGetLocation={handlePinpointClick}
        shouldCenter={true}
        hasLocation={Boolean(userLocation)}
      />
    </div>
  );
};

export default CenteringPinpointButton;
