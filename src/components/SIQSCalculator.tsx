
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
import { getSavedLocation, saveLocation } from "@/utils/locationStorage";
import { motion } from "framer-motion";
import { currentSiqsStore } from './index/CalculatorSection';

interface SIQSCalculatorProps {
  className?: string;
  hideRecommendedPoints?: boolean;
  noAutoLocationRequest?: boolean;
  onSiqsCalculated?: (siqsValue: number | null) => void;
}

const SIQSCalculator: React.FC<SIQSCalculatorProps> = ({ 
  className,
  hideRecommendedPoints = false,
  noAutoLocationRequest = false,
  onSiqsCalculated
}) => {
  const { language, t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [calculationInProgress, setCalculationInProgress] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [localBortleScale, setLocalBortleScale] = useState<number | null>(null);
  const [shouldAutoRequest, setShouldAutoRequest] = useState(!noAutoLocationRequest);
  
  const { setCachedData, getCachedData } = useLocationDataCache();
  
  useEffect(() => {
    if (!isMounted) {
      const savedLocation = getSavedLocation();
      if (savedLocation) {
        console.log("Found saved location:", savedLocation.name);
        setShouldAutoRequest(false);
      }
    }
  }, [isMounted]);
  
  useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);
  
  const locationSelectorProps = useMemo(() => ({
    language: language as Language,
    noAutoLocationRequest: noAutoLocationRequest || !shouldAutoRequest,
    bortleScale: localBortleScale,
    setBortleScale: setLocalBortleScale,
    setStatusMessage,
    setShowAdvancedSettings: () => {},
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

  const parsedLatitude = parseFloat(latitude) || 0;
  const parsedLongitude = parseFloat(longitude) || 0;
  
  const { seeingConditions, bortleScale } = useSIQSAdvancedSettings(parsedLatitude, parsedLongitude);

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
  
  useEffect(() => {
    setCalculationInProgress(isCalculating);
  }, [isCalculating]);
  
  useEffect(() => {
    if (!isMounted || !locationName || !latitude || !longitude) return;
    
    saveLocation({
      name: locationName,
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      bortleScale: localBortleScale || undefined
    });
  }, [locationName, latitude, longitude, localBortleScale, isMounted]);
  
  useEffect(() => {
    if (!isMounted || noAutoLocationRequest) return;
    
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
  }, [isMounted, noAutoLocationRequest, locationName, setLocationName, setLatitude, setLongitude]);
  
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
  
  useEffect(() => {
    if (!isMounted || !locationName) return;
    
    const handler = setTimeout(() => {
      calculateSIQS();
    }, 500);
    
    return () => clearTimeout(handler);
  }, [latitude, longitude, locationName, localBortleScale, seeingConditions, calculateSIQS, isMounted]);
  
  useEffect(() => {
    if (onSiqsCalculated) {
      onSiqsCalculated(siqsScore);
      // Also update the global store
      currentSiqsStore.setValue(siqsScore);
    }
  }, [siqsScore, onSiqsCalculated]);
  
  const animationVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { 
        type: "spring", 
        stiffness: 300, 
        damping: 24 
      }
    }
  };
  
  return (
    <motion.div 
      className={`glassmorphism-strong rounded-xl p-6 ${className} shadow-lg hover:shadow-xl transition-all duration-300 bg-cosmic-800/60 backdrop-blur-sm`}
      initial="hidden"
      animate="visible"
      variants={animationVariants}
    >
      <SIQSCalculatorHeader />
      
      <motion.div 
        variants={animationVariants}
        transition={{ delay: 0.1 }}
      >
        <StatusMessage message={statusMessage} loading={calculationInProgress} />
      </motion.div>
      
      {siqsScore !== null && (
        <motion.div 
          variants={animationVariants}
          transition={{ delay: 0.2 }}
        >
          <SIQSScore 
            score={siqsScore} 
            label={locationName}
          />
        </motion.div>
      )}
      
      <motion.div 
        className="space-y-4"
        variants={animationVariants}
        transition={{ delay: 0.3 }}
      >
        <LocationSelector 
          locationName={locationName} 
          loading={loading || calculationInProgress} 
          handleUseCurrentLocation={handleUseCurrentLocation}
          onSelectLocation={handleLocationSelect}
          noAutoLocationRequest={noAutoLocationRequest || !shouldAutoRequest}
        />
        
        {!hideRecommendedPoints && (
          <motion.div 
            variants={animationVariants}
            transition={{ delay: 0.4 }}
          >
            <RecommendedPhotoPoints 
              onSelectPoint={handleRecommendedPointSelect}
              userLocation={userLocation}
              hideEmptyMessage={true}
            />
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  );
};

export default React.memo(SIQSCalculator);
