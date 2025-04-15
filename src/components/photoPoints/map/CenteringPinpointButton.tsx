
import React, { useCallback, useEffect, useState } from 'react';
import { useMap } from 'react-leaflet';
import PinpointButton from './PinpointButton';

interface CenteringPinpointButtonProps {
  onGetLocation: () => void;
  userLocation: { latitude: number; longitude: number } | null;
  className?: string;
}

/**
 * A wrapper around PinpointButton that centers the map on the user's location
 */
const CenteringPinpointButton: React.FC<CenteringPinpointButtonProps> = ({
  onGetLocation,
  userLocation,
  className
}) => {
  // State to track if we have a valid map reference
  const [hasValidMap, setHasValidMap] = useState(false);
  let map: any = null;
  
  // Always call useMap, but handle the error if not in a MapContainer context
  try {
    map = useMap();
    // Set state indicating we have a valid map reference
    useEffect(() => {
      setHasValidMap(true);
    }, []);
  } catch (error) {
    // If not in a MapContainer context, we'll just handle it gracefully
    useEffect(() => {
      console.log("CenteringPinpointButton not used within MapContainer context");
      setHasValidMap(false);
    }, []);
  }

  const handleGetLocationAndCenter = useCallback(() => {
    // Always trigger the location update
    onGetLocation();
    
    // Only attempt to center the map if we have a valid map reference
    if (hasValidMap && map && userLocation) {
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
  }, [onGetLocation, userLocation, map, hasValidMap]);

  return (
    <PinpointButton
      onGetLocation={handleGetLocationAndCenter}
      className={className}
    />
  );
};

export default CenteringPinpointButton;
