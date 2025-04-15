
import React, { useCallback } from 'react';
import { useMap } from 'react-leaflet';
import PinpointButton from './PinpointButton';

interface CenteringPinpointButtonProps {
  onGetLocation: () => void;
  userLocation: { latitude: number; longitude: number } | null;
  className?: string;
}

const CenteringPinpointButton: React.FC<CenteringPinpointButtonProps> = ({
  onGetLocation,
  userLocation,
  className
}) => {
  const map = useMap();

  const handleGetLocationAndCenter = useCallback(() => {
    onGetLocation();
    
    // Add a short delay to let the location update before centering
    setTimeout(() => {
      if (userLocation && map) {
        // Center map on user location after pinpoint button is clicked
        map.setView([userLocation.latitude, userLocation.longitude], map.getZoom(), {
          animate: true,
          duration: 1
        });
      }
    }, 300);
  }, [onGetLocation, userLocation, map]);

  return (
    <PinpointButton
      onGetLocation={handleGetLocationAndCenter}
      className={className}
    />
  );
};

export default CenteringPinpointButton;
