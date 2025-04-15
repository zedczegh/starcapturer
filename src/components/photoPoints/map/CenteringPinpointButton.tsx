
import React, { useCallback, useEffect, useState } from 'react';
import { useMap } from 'react-leaflet';
import PinpointButton from './PinpointButton';

interface CenteringPinpointButtonProps {
  onGetLocation: () => void;
  userLocation: { latitude: number; longitude: number } | null;
  className?: string;
  disableAutoCenter?: boolean;
}

/**
 * A wrapper around PinpointButton that centers the map on the user's location
 */
const CenteringPinpointButton: React.FC<CenteringPinpointButtonProps> = ({
  onGetLocation,
  userLocation,
  className,
  disableAutoCenter = false
}) => {
  // State to track if we have a valid map reference
  const [hasValidMap, setHasValidMap] = useState(false);
  const [mapRef, setMapRef] = useState<any>(null);
  
  // Always call useMap, but handle the error if not in a MapContainer context
  try {
    const map = useMap();
    // Store map reference and set valid state
    useEffect(() => {
      setMapRef(map);
      setHasValidMap(true);
    }, [map]);
  } catch (error) {
    // If not in a MapContainer context, we'll just handle it gracefully
    useEffect(() => {
      console.log("CenteringPinpointButton not used within MapContainer context");
      setMapRef(null);
      setHasValidMap(false);
    }, []);
  }

  const handleGetLocationAndCenter = useCallback(() => {
    // Always trigger the location update
    onGetLocation();
    
    // Only attempt to center the map if explicitly enabled
    if (!disableAutoCenter && hasValidMap && mapRef && userLocation) {
      // Add a short delay to let the location update before centering
      setTimeout(() => {
        if (userLocation && mapRef) {
          // Center map on user location after pinpoint button is clicked
          mapRef.setView([userLocation.latitude, userLocation.longitude], mapRef.getZoom(), {
            animate: true,
            duration: 1
          });
        }
      }, 300);
    }
  }, [onGetLocation, userLocation, mapRef, hasValidMap, disableAutoCenter]);

  return (
    <PinpointButton
      onGetLocation={handleGetLocationAndCenter}
      className={className}
    />
  );
};

export default CenteringPinpointButton;
