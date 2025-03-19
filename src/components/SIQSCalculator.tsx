
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import RecommendedPhotoPoints from "./RecommendedPhotoPoints";
import { useLocationDataCache } from "@/hooks/useLocationData";
import { useSIQSCalculation } from "@/hooks/useSIQSCalculation";
import LocationSelector from "./siqs/LocationSelector";
import SIQSScore from "./siqs/SIQSScore";
import SIQSCalculatorHeader from "./siqs/SIQSCalculatorHeader";
import StatusMessage from "./siqs/StatusMessage";
import { useLocationSelectorState } from "./siqs/hooks/useLocationSelectorState";
import useSIQSAdvancedSettings from "./siqs/hooks/useSIQSAdvancedSettings";
import { Language } from "@/services/geocoding/types";
import { getLocationNameForCoordinates } from "./location/map/LocationNameService";

interface SIQSCalculatorProps {
  className?: string;
  hideRecommendedPoints?: boolean;
  noAutoLocationRequest?: boolean;
}

const SIQSCalculator: React.FC<SIQSCalculatorProps> = ({ 
  className,
  hideRecommendedPoints = false,
  noAutoLocationRequest = false
}) => {
  const { language, t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [calculationInProgress, setCalculationInProgress] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [localBortleScale, setLocalBortleScale] = useState<number | null>(null);
  const [shouldAutoRequest, setShouldAutoRequest] = useState(!noAutoLocationRequest);
  
  const { setCachedData, getCachedData } = useLocationDataCache();
  
  // Check if we have saved location data in localStorage
  useEffect(() => {
    try {
      const savedLocationString = localStorage.getItem('latest_siqs_location');
      if (savedLocationString) {
        const savedLocation = JSON.parse(savedLocationString);
        // If we have valid saved location, don't auto-request new location
        if (savedLocation && savedLocation.name && savedLocation.latitude && savedLocation.longitude) {
          setShouldAutoRequest(false);
        }
      }
    } catch (e) {
      console.error("Error checking saved location:", e);
    }
  }, []);
  
  const locationSelectorProps = useMemo(() => ({
    language: language as Language,
    noAutoLocationRequest: noAutoLocationRequest || !shouldAutoRequest,
    bortleScale: localBortleScale,
    setBortleScale: setLocalBortleScale,
    setStatusMessage,
    setShowAdvancedSettings: () => {}, // This is now handled differently
    getCachedData,
    setCachedData
  }), [language, noAutoLocationRequest, shouldAutoRequest, localBortleScale, setStatusMessage, getCachedData, setCachedData]);

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

  // Track component mount state to avoid unnecessary effects
  useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);

  // Parse latitude and longitude for hook usage
  const parsedLatitude = parseFloat(latitude) || 0;
  const parsedLongitude = parseFloat(longitude) || 0;
  
  // Pass the parsed coordinates to the hook
  const { seeingConditions, bortleScale } = useSIQSAdvancedSettings(parsedLatitude, parsedLongitude);

  // Update local Bortle scale when hook value changes
  useEffect(() => {
    if (bortleScale !== undefined) {
      setLocalBortleScale(bortleScale);
    }
  }, [bortleScale]);

  const {
    isCalculating,
    siqsScore,
    calculateSIQSForLocation
  } = useSIQSCalculation(setCachedData, getCachedData);
  
  // Update location name when language changes
  useEffect(() => {
    if (!isMounted || !latitude || !longitude || !locationName) return;
    
    // Skip special locations
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
          { setCachedData, getCachedData }
        );
        
        if (newName && newName !== locationName) {
          setLocationName(newName);
        }
      } catch (error) {
        console.error("Error updating location name for language change:", error);
      }
    };
    
    updateLocationNameForLanguage();
  }, [language, latitude, longitude, locationName, setCachedData, getCachedData, setLocationName, isMounted]);
  
  // Track calculation state for loading indicator
  useEffect(() => {
    setCalculationInProgress(isCalculating);
  }, [isCalculating]);
  
  // Save current location to localStorage when it changes
  useEffect(() => {
    if (locationName && latitude && longitude) {
      try {
        const locationToSave = {
          name: locationName,
          latitude: parseFloat(latitude),
          longitude: parseFloat(longitude)
        };
        localStorage.setItem('latest_siqs_location', JSON.stringify(locationToSave));
      } catch (e) {
        console.error("Error saving location to localStorage:", e);
      }
    }
  }, [locationName, latitude, longitude]);
  
  // Memoize the SIQS calculation for better performance
  const calculateSIQS = useCallback(() => {
    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);
    
    if (!locationName || isNaN(lat) || isNaN(lng)) return;
    
    if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
      setCalculationInProgress(true);
      calculateSIQSForLocation(
        lat, 
        lng, 
        locationName, 
        true, 
        localBortleScale, 
        seeingConditions,
        undefined,
        setStatusMessage,
        language as Language
      )
      .finally(() => {
        setCalculationInProgress(false);
      });
    }
  }, [latitude, longitude, locationName, localBortleScale, seeingConditions, language, calculateSIQSForLocation, setStatusMessage]);
  
  // Debounced SIQS calculation when inputs change
  useEffect(() => {
    if (!isMounted || !locationName) return;
    
    const handler = setTimeout(() => {
      calculateSIQS();
    }, 500);
    
    return () => clearTimeout(handler);
  }, [latitude, longitude, locationName, localBortleScale, seeingConditions, calculateSIQS, isMounted]);
  
  return (
    <div className={`glassmorphism-strong rounded-xl p-6 ${className} shadow-lg hover:shadow-xl transition-all duration-300`}>
      <SIQSCalculatorHeader />
      
      <StatusMessage message={statusMessage} loading={calculationInProgress} />
      
      {siqsScore !== null && (
        <SIQSScore 
          siqsScore={siqsScore} 
          latitude={parseFloat(latitude)}
          longitude={parseFloat(longitude)}
          locationName={locationName}
        />
      )}
      
      <div className="space-y-4">
        <LocationSelector 
          locationName={locationName} 
          loading={loading || calculationInProgress} 
          handleUseCurrentLocation={handleUseCurrentLocation}
          onSelectLocation={handleLocationSelect}
          noAutoLocationRequest={noAutoLocationRequest || !shouldAutoRequest}
        />
        
        {!hideRecommendedPoints && (
          <RecommendedPhotoPoints 
            onSelectPoint={handleRecommendedPointSelect}
            userLocation={userLocation}
          />
        )}
      </div>
    </div>
  );
};

export default React.memo(SIQSCalculator);
