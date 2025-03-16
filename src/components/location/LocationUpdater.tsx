
import React, { memo, useCallback, useEffect, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import LocationMap from "@/components/location/LocationMap";
import { toast } from "sonner";

interface LocationUpdaterProps {
  locationData: any;
  onLocationUpdate: (location: { name: string; latitude: number; longitude: number }) => Promise<void>;
  gettingUserLocation: boolean;
  setGettingUserLocation: (state: boolean) => void;
  setStatusMessage: (message: string | null) => void;
}

const LocationUpdater: React.FC<LocationUpdaterProps> = ({
  locationData,
  onLocationUpdate,
  gettingUserLocation,
  setGettingUserLocation,
  setStatusMessage
}) => {
  const { t } = useLanguage();
  const updateInProgressRef = useRef(false);
  const locationUpdateTimeoutRef = useRef<number | null>(null);
  const lastUpdateRef = useRef<{lat: number, lng: number} | null>(null);

  // Safely check if locationData has required properties
  const hasValidCoordinates = locationData && 
    typeof locationData.latitude === 'number' && isFinite(locationData.latitude) && 
    typeof locationData.longitude === 'number' && isFinite(locationData.longitude);

  // Default coordinates to use if locationData is invalid
  const fallbackLatitude = 0;
  const fallbackLongitude = 0;
  const fallbackName = t("Unnamed Location", "未命名位置");

  // Cleanup function for timeouts
  useEffect(() => {
    return () => {
      if (locationUpdateTimeoutRef.current) {
        clearTimeout(locationUpdateTimeoutRef.current);
      }
    };
  }, []);

  // Check if the location change is significant (prevent tiny changes from triggering updates)
  const isSignificantChange = (lat1: number, lng1: number, lat2: number, lng2: number): boolean => {
    // If we don't have a previous update, consider it significant
    if (!lastUpdateRef.current) return true;
    
    // Calculate distance using simple Euclidean distance (sufficient for small differences)
    const latDiff = Math.abs(lat1 - lat2);
    const lngDiff = Math.abs(lng1 - lng2);
    
    // Only consider significant if it changes by more than 0.001 degrees (roughly ~100m)
    return latDiff > 0.001 || lngDiff > 0.001;
  };

  // Memoized location update handler with debouncing and throttling
  const handleLocationUpdate = useCallback(async (location: { name: string; latitude: number; longitude: number }) => {
    // Skip small location changes to improve performance
    if (lastUpdateRef.current && 
        !isSignificantChange(location.latitude, location.longitude, 
                           lastUpdateRef.current.lat, lastUpdateRef.current.lng)) {
      console.log('Skipping insignificant location change');
      return;
    }
    
    if (updateInProgressRef.current) {
      console.log('Update already in progress, queuing request');
      
      // If we have a pending timeout, clear it
      if (locationUpdateTimeoutRef.current) {
        clearTimeout(locationUpdateTimeoutRef.current);
      }
      
      // Queue the update for later
      locationUpdateTimeoutRef.current = window.setTimeout(() => {
        handleLocationUpdate(location);
      }, 1000);
      
      return;
    }
    
    console.log('Location update received:', location);
    updateInProgressRef.current = true;
    
    try {
      // Update our reference to the last processed coordinates
      lastUpdateRef.current = {
        lat: location.latitude,
        lng: location.longitude
      };
      
      await onLocationUpdate(location);
    } catch (error) {
      console.error('Error updating location:', error);
      setStatusMessage(t('Failed to update location', '更新位置失败'));
      toast.error(t('Failed to update location', '更新位置失败'));
    } finally {
      // Allow next update after a small delay to prevent rapid consecutive updates
      setTimeout(() => {
        updateInProgressRef.current = false;
      }, 500);
    }
  }, [onLocationUpdate, setStatusMessage, t]);

  return (
    <Card className="shadow-xl overflow-hidden bg-cosmic-900/80 border-cosmic-600/20 hover:shadow-2xl transition-all duration-300">
      <CardHeader className="pb-2 bg-cosmic-800/50 border-b border-cosmic-600/10">
        <CardTitle className="text-xl flex items-center">
          <MapPin className="mr-2 h-5 w-5 text-primary" />
          {t("Location", "位置")}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <LocationMap
          latitude={hasValidCoordinates ? locationData.latitude : fallbackLatitude}
          longitude={hasValidCoordinates ? locationData.longitude : fallbackLongitude}
          name={hasValidCoordinates && locationData.name ? locationData.name : fallbackName}
          onLocationUpdate={handleLocationUpdate}
          editable={true}
          showInfoPanel={false}
        />
      </CardContent>
    </Card>
  );
};

export default memo(LocationUpdater);
