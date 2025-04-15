
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
  // Try to use map context, but don't fail if not available
  let map: any = null;
  
  try {
    // This will throw an error if not inside a MapContainer
    map = useMap();
  } catch (error) {
    // If not in a MapContainer context, we'll just use regular PinpointButton
    console.log("CenteringPinpointButton not used within MapContainer context");
  }

  const handleGetLocationAndCenter = useCallback(() => {
    onGetLocation();
    
    // Only attempt to center the map if we have a valid map reference
    if (map && userLocation) {
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
    }
  }, [onGetLocation, userLocation, map]);

  return (
    <PinpointButton
      onGetLocation={handleGetLocationAndCenter}
      className={className}
    />
  );
};

export default CenteringPinpointButton;
