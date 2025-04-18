import React, { useCallback, useState, useRef, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { fetchRealTimeSiqs } from '@/services/realTimeSiqsService';
import { clearLocationCache } from '@/services/realTimeSiqsService';
import LocationControllers from './LocationControllers';
import SiqsDisplay from './SiqsDisplay';

interface RealTimeLocationUpdaterProps {
  userLocation: { latitude: number; longitude: number } | null;
  onLocationUpdate: (latitude: number, longitude: number) => void;
  showControls?: boolean;
}

const RealTimeLocationUpdater: React.FC<RealTimeLocationUpdaterProps> = ({
  userLocation,
  onLocationUpdate,
  showControls = true
}) => {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [realTimeSiqs, setRealTimeSiqs] = useState<number | null>(null);
  const lastFetchRef = useRef<number>(0);
  const locationRef = useRef<{ latitude: number; longitude: number } | null>(null);
  const [cacheCleared, setCacheCleared] = useState<boolean>(false);

  useEffect(() => {
    if (userLocation) {
      locationRef.current = userLocation;
    }
  }, [userLocation]);

  const calculateCurrentSiqs = useCallback(async () => {
    if (!userLocation) {
      console.error("No location selected");
      return;
    }

    const now = Date.now();
    if (now - lastFetchRef.current < 10000) {
      return;
    }
    lastFetchRef.current = now;

    setLoading(true);
    try {
      const defaultBortleScale = 4;
      
      const result = await fetchRealTimeSiqs(
        userLocation.latitude,
        userLocation.longitude,
        defaultBortleScale
      );
      
      setRealTimeSiqs(result.siqs);
      
    } catch (error) {
      console.error("Error calculating real-time SIQS:", error);
    } finally {
      setLoading(false);
    }
  }, [userLocation]);

  const handleClearCache = useCallback(() => {
    try {
      clearLocationCache();
      setCacheCleared(true);
      console.log("Location cache cleared");
      
      setTimeout(() => setCacheCleared(false), 3000);
    } catch (error) {
      console.error("Error clearing location cache:", error);
    }
  }, []);

  useEffect(() => {
    if (!userLocation) return;
    
    if (
      locationRef.current &&
      locationRef.current.latitude === userLocation.latitude &&
      locationRef.current.longitude === userLocation.longitude
    ) {
      return;
    }
    
    locationRef.current = userLocation;
    
    calculateCurrentSiqs();
  }, [userLocation, calculateCurrentSiqs]);

  const handleGetCurrentLocation = useCallback(() => {
    setLoading(true);
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        onLocationUpdate(latitude, longitude);
        setLoading(false);
        
        try {
          const leafletMap = (window as any).leafletMap;
          if (leafletMap) {
            leafletMap.setView([latitude, longitude], 12, { 
              animate: true,
              duration: 1.5 
            });
            console.log("Map centered on current location:", latitude, longitude);
            
            if (leafletMap.dragging) {
              leafletMap.dragging.enable();
              console.log("Dragging explicitly enabled after location update");
            }
          } else {
            console.warn("Leaflet map instance not found in window object");
          }
        } catch (e) {
          console.error("Could not center map:", e);
        }
      },
      (error) => {
        console.error("Error getting location:", error);
        setLoading(false);
        
        let errorMsg = "Failed to get your location";
        
        if (error.code === 1) {
          errorMsg = "Location permission denied";
        } else if (error.code === 2) {
          errorMsg = "Location unavailable";
        } else if (error.code === 3) {
          errorMsg = "Location request timed out";
        }
        
        console.error(errorMsg);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }, [onLocationUpdate]);

  if (!showControls) {
    return null;
  }

  return (
    <div className="absolute bottom-4 left-4 z-[1000] flex flex-col space-y-2">
      <LocationControllers
        onGetLocation={handleGetCurrentLocation}
        onClearCache={handleClearCache}
        loading={loading}
        cacheCleared={cacheCleared}
        userLocation={userLocation}
      />
      
      <SiqsDisplay 
        realTimeSiqs={realTimeSiqs} 
        loading={loading} 
      />
    </div>
  );
};

export default RealTimeLocationUpdater;
