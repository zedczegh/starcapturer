
import React, { useCallback, useState, useRef, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';
import { calculateRealTimeSiqs } from '@/services/realTimeSiqsService';
import { clearLocationCache } from '@/services/realTimeSiqsService/locationUpdateService';
import LocationControls from './LocationControls';
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

  // Update reference to track location changes
  useEffect(() => {
    if (userLocation) {
      locationRef.current = userLocation;
    }
  }, [userLocation]);

  // Calculate real-time SIQS for current location
  const calculateCurrentSiqs = useCallback(async () => {
    if (!userLocation) {
      toast.error(t("No location selected", "未选择位置"));
      return;
    }

    // Avoid duplicate fetches within 10 seconds
    const now = Date.now();
    if (now - lastFetchRef.current < 10000) {
      return;
    }
    lastFetchRef.current = now;

    setLoading(true);
    try {
      // Default Bortle scale if not available
      const defaultBortleScale = 4;
      
      const result = await calculateRealTimeSiqs(
        userLocation.latitude,
        userLocation.longitude,
        defaultBortleScale
      );
      
      setRealTimeSiqs(result.siqs);
      
    } catch (error) {
      console.error("Error calculating real-time SIQS:", error);
      toast.error(t("Failed to calculate SIQS", "计算SIQS失败"));
    } finally {
      setLoading(false);
    }
  }, [userLocation, t]);

  // Clear location cache
  const handleClearCache = useCallback(() => {
    try {
      clearLocationCache();
      setCacheCleared(true);
      toast.success(t("Location cache cleared", "位置缓存已清除"));
      
      // Reset flag after 3 seconds
      setTimeout(() => setCacheCleared(false), 3000);
    } catch (error) {
      console.error("Error clearing location cache:", error);
    }
  }, [t]);

  // Automatically calculate SIQS when location changes
  useEffect(() => {
    if (!userLocation) return;
    
    // Check if location has actually changed
    if (
      locationRef.current &&
      locationRef.current.latitude === userLocation.latitude &&
      locationRef.current.longitude === userLocation.longitude
    ) {
      return;
    }
    
    // Update the location reference
    locationRef.current = userLocation;
    
    // Calculate SIQS for the new location
    calculateCurrentSiqs();
  }, [userLocation, calculateCurrentSiqs]);

  // Get current location with high accuracy
  const handleGetCurrentLocation = useCallback(() => {
    setLoading(true);
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        onLocationUpdate(latitude, longitude);
        setLoading(false);
        
        // Center map on user location using the globally accessible map instance
        try {
          const leafletMap = (window as any).leafletMap;
          if (leafletMap) {
            // Use animation for a smoother experience and higher zoom level
            leafletMap.setView([latitude, longitude], 12, { 
              animate: true,
              duration: 1.5 
            });
            console.log("Map centered on current location:", latitude, longitude);
            
            // Force dragging to be enabled
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
        
        // Removed "Using your current location" toast notification
      },
      (error) => {
        console.error("Error getting location:", error);
        setLoading(false);
        
        // Provide user-friendly error messages
        let errorMsg = t("Failed to get your location", "获取您的位置失败");
        
        if (error.code === 1) {
          errorMsg = t("Location permission denied", "位置权限被拒绝");
        } else if (error.code === 2) {
          errorMsg = t("Location unavailable", "位置信息不可用");
        } else if (error.code === 3) {
          errorMsg = t("Location request timed out", "位置请求超时");
        }
        
        toast.error(errorMsg);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }, [onLocationUpdate, t]);

  if (!showControls) {
    return null;
  }

  return (
    <div className="absolute bottom-4 left-4 z-[1000] flex flex-col space-y-2">
      <LocationControls
        onGetLocation={handleGetCurrentLocation}
        onClearCache={handleClearCache}
        loading={loading}
        cacheCleared={cacheCleared}
      />
      
      <SiqsDisplay 
        realTimeSiqs={realTimeSiqs} 
        loading={loading} 
      />
    </div>
  );
};

export default RealTimeLocationUpdater;
