
import { useCallback, useRef } from 'react';
import { getCurrentPosition } from '@/utils/geolocationUtils';

interface MapEventHandlersProps {
  onMapClick?: (lat: number, lng: number) => void;
  onMapReady?: () => void;
}

/**
 * Hook to handle map events
 */
export const useMapEventHandlers = ({
  onMapClick,
  onMapReady
}: MapEventHandlersProps) => {
  const mapRef = useRef<any>(null);
  
  // Handle map ready
  const handleMapReady = useCallback(() => {
    if (onMapReady) {
      onMapReady();
    }
    
    // Make map instance available globally for external access
    if (mapRef.current) {
      (window as any).leafletMap = mapRef.current;
    }
  }, [onMapReady]);
  
  // Handle map click - always allow location updates when map is clicked
  const handleMapClick = useCallback((lat: number, lng: number) => {
    if (onMapClick) {
      onMapClick(lat, lng);
      console.log("Map clicked, updating location to:", lat, lng);
    }
  }, [onMapClick]);
  
  // Handle getting current user location via geolocation
  const handleGetLocation = useCallback(() => {
    if (onMapClick) {
      getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          onMapClick(latitude, longitude);
          
          // Access the map instance and set view to the location
          if (mapRef.current) {
            const leafletMap = mapRef.current;
            leafletMap.setView([latitude, longitude], 12, {
              animate: true,
              duration: 1
            });
          }
          
          console.log("Got user position:", latitude, longitude);
        },
        (error) => {
          console.error("Error getting location:", error.message);
        },
        {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0
        }
      );
    }
  }, [onMapClick]);
  
  return {
    mapRef,
    handleMapReady,
    handleMapClick,
    handleGetLocation
  };
};
