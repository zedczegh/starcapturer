
import { useState, useEffect } from "react";
import { useNavigate, Location, NavigateFunction } from "react-router-dom";
import { getSavedLocation } from "@/utils/locationStorage";
import { useUserGeolocation } from "@/hooks/community/useUserGeolocation";
import { getCurrentPosition } from "@/utils/geolocationUtils";

interface UseLocationDetailsLogicProps {
  id: string | undefined;
  location: Location;
  navigate: NavigateFunction;
  t: (key: string, fallback: string) => string;
  setCachedData: (key: string, data: any) => void;
  getCachedData: (key: string) => any;
  alwaysUseCurrentLocation?: boolean;
}

export const useLocationDetailsLogic = ({ 
  id, 
  location, 
  navigate, 
  t, 
  setCachedData, 
  getCachedData,
  alwaysUseCurrentLocation = false
}: UseLocationDetailsLogicProps) => {
  const [locationData, setLocationData] = useState<any>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<"info" | "error" | "success" | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingCurrentLocation, setLoadingCurrentLocation] = useState(false);
  
  // User's current geolocation
  const currentUserPosition = useUserGeolocation();

  // Try to get current location when requested
  useEffect(() => {
    // If we have location data from state, don't override it
    if (location.state || !alwaysUseCurrentLocation) {
      return;
    }

    // Try to get current location
    setLoadingCurrentLocation(true);
    
    getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const newLocationData = {
          id: `loc-${latitude}-${longitude}`,
          name: t("Current Location", "当前位置"),
          latitude,
          longitude,
          timestamp: new Date().toISOString(),
          fromCurrentLocation: true
        };
        
        setLocationData(newLocationData);
        setCachedData(`location_${newLocationData.id}`, newLocationData);
        
        // Update the URL to reflect the new location
        navigate(`/location/${latitude},${longitude}`, { 
          state: newLocationData,
          replace: true 
        });
        
        setLoadingCurrentLocation(false);
        setIsLoading(false);
      },
      (error) => {
        console.error("Error getting current location:", error);
        setLoadingCurrentLocation(false);
        // Continue with other location finding methods
      },
      { 
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0
      }
    );
  }, [alwaysUseCurrentLocation, location.state, navigate, setCachedData, t]);

  useEffect(() => {
    let initialData = null;
    
    // First check if we have data in the route state
    if (location.state) {
      console.log("Route state data found:", location.state);
      initialData = location.state;
    } 
    // Then check if the id can be parsed as coordinates
    else if (id && id.includes(',')) {
      console.log("Parsing coordinates from id:", id);
      try {
        const [lat, lng] = id.split(',').map(parseFloat);
        if (!isNaN(lat) && !isNaN(lng)) {
          // Get saved location first
          const savedLocation = getSavedLocation();
          
          // Create bare-minimum location data
          initialData = {
            id: `loc-${lat}-${lng}`,
            name: savedLocation?.name || t("Current Location", "当前位置"),
            latitude: lat,
            longitude: lng,
            timestamp: savedLocation?.timestamp || new Date().toISOString(),
            // If this is likely the current location and we have saved SIQS, use it
            siqsResult: savedLocation?.siqsResult || { score: 0 }
          };
        }
      } catch (error) {
        console.error("Error parsing location id:", error);
      }
    }
    
    // If we still don't have data, check for saved location
    if (!initialData) {
      console.log("No location data found, checking for saved location");
      const savedLocation = getSavedLocation();
      if (savedLocation) {
        console.log("Using saved location:", savedLocation);
        initialData = savedLocation;
      }
    }
    
    // Set the location data if we have it
    if (initialData) {
      setLocationData(initialData);
      
      // Also update the cached data
      if (initialData.id) {
        setCachedData(`location_${initialData.id}`, initialData);
      }
    } else if (currentUserPosition && !alwaysUseCurrentLocation) {
      // If we have current user position but no location data, create it
      const [latitude, longitude] = currentUserPosition;
      const newLocationId = `loc-${latitude}-${longitude}`;
      
      initialData = {
        id: newLocationId,
        name: t("Current Location", "当前位置"),
        latitude,
        longitude,
        timestamp: new Date().toISOString()
      };
      
      setLocationData(initialData);
      setCachedData(`location_${newLocationId}`, initialData);
      
      // Update the URL to reflect the new location
      navigate(`/location/${latitude},${longitude}`, { 
        state: initialData,
        replace: true 
      });
    }
    
    setIsLoading(false);
  }, [id, location.state, navigate, setCachedData, getCachedData, t, currentUserPosition, alwaysUseCurrentLocation]);

  const handleUpdateLocation = async (updatedData: any) => {
    try {
      if (!updatedData) return;
      
      setMessageType("success");
      setStatusMessage(t("Location updated successfully", "位置更新成功"));
      
      // Update local state
      setLocationData((prev: any) => ({
        ...prev,
        ...updatedData,
        timestamp: new Date().toISOString()
      }));
      
      // Also update cache
      if (locationData?.id) {
        const newData = {
          ...locationData,
          ...updatedData,
          timestamp: new Date().toISOString()
        };
        setCachedData(`location_${locationData.id}`, newData);
      }
      
      setTimeout(() => {
        setStatusMessage(null);
      }, 3000);
    } catch (error) {
      console.error("Error updating location:", error);
      setMessageType("error");
      setStatusMessage(t("Failed to update location", "更新位置失败"));
    }
  };

  return {
    locationData,
    setLocationData,
    statusMessage,
    messageType,
    setStatusMessage,
    handleUpdateLocation,
    isLoading,
    loadingCurrentLocation,
    setLoadingCurrentLocation
  };
};
