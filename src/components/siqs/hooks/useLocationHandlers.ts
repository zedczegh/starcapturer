
import { useState, useCallback, useEffect } from "react";
import { Language } from "@/services/geocoding/types";
import { getLocationNameForCoordinates } from "@/components/location/map/LocationNameService";
import { saveLocation, getSavedLocation } from "@/utils/locationStorage";
import { useLocationSelectorState } from "./useLocationSelectorState";

export function useLocationHandlers({
  locationSelectorProps,
  isMounted,
  setLocalBortleScale,
  calculateSIQSForLocation,
  setStatusMessage,
  language,
  seeingConditions
}: any) {
  const {
    userLocation,
    locationName,
    latitude,
    longitude,
    setLocationName,
    setLatitude,
    setLongitude,
    handleUseCurrentLocation,
    handleLocationSelect,
    handleRecommendedPointSelect
  } = useLocationSelectorState(locationSelectorProps);

  const parsedLatitude = parseFloat(latitude) || 0;
  const parsedLongitude = parseFloat(longitude) || 0;
  
  useEffect(() => {
    if (!isMounted || !latitude || !longitude || !locationName) return;
    
    if (locationName === "北京" || locationName === "Beijing") return;
    
    const updateLocationNameForLanguage = async () => {
      const lat = parseFloat(latitude);
      const lng = parseFloat(longitude);
      
      if (isNaN(lat) || isNaN(lng)) return;
      
      try {
        const newName = await getLocationNameForCoordinates(
          lat, 
          lng, 
          language as Language, 
          { setCachedData: locationSelectorProps.setCachedData, getCachedData: locationSelectorProps.getCachedData }
        );
        
        if (newName && newName !== locationName) {
          setLocationName(newName);
        }
      } catch (error) {
        console.error("Error updating location name for language change:", error);
      }
    };
    
    updateLocationNameForLanguage();
  }, [language, latitude, longitude, locationName, isMounted, locationSelectorProps, setLocationName]);
  
  useEffect(() => {
    if (!isMounted || !locationName || !latitude || !longitude) return;
    
    saveLocation({
      name: locationName,
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      bortleScale: locationSelectorProps.bortleScale || undefined
    });
  }, [locationName, latitude, longitude, locationSelectorProps.bortleScale, isMounted]);
  
  useEffect(() => {
    if (!isMounted || locationSelectorProps.noAutoLocationRequest) return;
    
    const savedLocation = getSavedLocation();
    if (savedLocation && !locationName) {
      setLocationName(savedLocation.name);
      setLatitude(savedLocation.latitude.toString());
      setLongitude(savedLocation.longitude.toString());
      if (savedLocation.bortleScale) {
        setLocalBortleScale(savedLocation.bortleScale);
      }
      console.log("Restored saved location:", savedLocation.name);
    }
  }, [isMounted, locationSelectorProps.noAutoLocationRequest, locationName, setLocationName, setLatitude, setLongitude, setLocalBortleScale]);
  
  const calculateSIQS = useCallback(() => {
    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);
    
    if (!locationName || isNaN(lat) || isNaN(lng)) return;
    
    if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
      calculateSIQSForLocation(
        lat, 
        lng, 
        locationName, 
        true, 
        locationSelectorProps.bortleScale, 
        seeingConditions,
        undefined,
        setStatusMessage,
        language as Language
      );
    }
  }, [latitude, longitude, locationName, locationSelectorProps.bortleScale, seeingConditions, language, calculateSIQSForLocation, setStatusMessage]);
  
  useEffect(() => {
    if (!isMounted || !locationName) return;
    
    const handler = setTimeout(() => {
      calculateSIQS();
    }, 500);
    
    return () => clearTimeout(handler);
  }, [latitude, longitude, locationName, locationSelectorProps.bortleScale, seeingConditions, calculateSIQS, isMounted]);

  return {
    userLocation,
    locationName,
    latitude, 
    longitude,
    handleUseCurrentLocation,
    handleLocationSelect,
    handleRecommendedPointSelect
  };
}
