
import React, { useCallback, useEffect, useState, useRef } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { MapPin, Loader2, RefreshCw } from 'lucide-react';
import { calculateRealTimeSiqs } from '@/services/realTimeSiqsService';
import SiqsScoreBadge from '../cards/SiqsScoreBadge';

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

  // Get current location
  const handleGetCurrentLocation = useCallback(() => {
    setLoading(true);
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        onLocationUpdate(latitude, longitude);
        setLoading(false);
        toast.success(t("Using your current location", "使用您的当前位置"));
      },
      (error) => {
        console.error("Error getting location:", error);
        setLoading(false);
        toast.error(t("Failed to get your location", "获取您的位置失败"));
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }, [onLocationUpdate, t]);

  if (!showControls) {
    return null;
  }

  return (
    <div className="absolute bottom-4 left-4 z-[1000] flex flex-col space-y-2">
      <Button 
        size="sm" 
        variant="secondary"
        className="bg-cosmic-800/80 hover:bg-cosmic-700/90 shadow-md"
        onClick={handleGetCurrentLocation}
        disabled={loading}
      >
        {loading ? (
          <Loader2 className="h-4 w-4 mr-1 animate-spin" />
        ) : (
          <MapPin className="h-4 w-4 mr-1" />
        )}
        {t("My Location", "我的位置")}
      </Button>
      
      <Button
        size="sm"
        variant="outline"
        className="bg-cosmic-800/80 hover:bg-cosmic-700/90 text-primary-foreground shadow-md"
        onClick={calculateCurrentSiqs}
        disabled={loading || !userLocation}
      >
        {loading ? (
          <Loader2 className="h-4 w-4 mr-1 animate-spin" />
        ) : (
          <RefreshCw className="h-4 w-4 mr-1" />
        )}
        {t("Update SIQS", "更新SIQS")}
      </Button>
      
      {realTimeSiqs !== null && (
        <div className="bg-cosmic-800/80 rounded-md p-1.5 shadow-md flex items-center justify-center">
          <SiqsScoreBadge score={realTimeSiqs} loading={loading} />
        </div>
      )}
    </div>
  );
};

export default RealTimeLocationUpdater;
