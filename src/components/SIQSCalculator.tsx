
import React, { useState, useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import RecommendedPhotoPoints from "./RecommendedPhotoPoints";
import { useCurrentLocation, useLocationDataCache } from "@/hooks/useLocationData";
import { useSIQSCalculation } from "@/hooks/useSIQSCalculation";
import LocationSelector from "./siqs/LocationSelector";
import SIQSScore from "./siqs/SIQSScore";
import AdvancedSettings from "./siqs/AdvancedSettings";
import SIQSCalculatorHeader from "./siqs/SIQSCalculatorHeader";
import StatusMessage from "./siqs/StatusMessage";
import CalculateButton from "./siqs/CalculateButton";
import { useLocationSelectorState } from "./siqs/hooks/useLocationSelectorState";
import { useSIQSAdvancedSettings } from "./siqs/hooks/useSIQSAdvancedSettings";

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
  
  const { setCachedData, getCachedData } = useLocationDataCache();
  
  const {
    seeingConditions, 
    setSeeingConditions,
    bortleScale,
    setBortleScale,
    showAdvancedSettings, 
    setShowAdvancedSettings
  } = useSIQSAdvancedSettings();
  
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
  } = useLocationSelectorState({
    language,
    noAutoLocationRequest,
    bortleScale,
    setBortleScale,
    setStatusMessage,
    setShowAdvancedSettings,
    getCachedData,
    setCachedData
  });

  const {
    isCalculating,
    siqsScore,
    validateInputs,
    calculateSIQSForLocation
  } = useSIQSCalculation(setCachedData, getCachedData);
  
  useEffect(() => {
    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);
    
    if (!locationName || isNaN(lat) || isNaN(lng)) return;
    
    const handler = setTimeout(() => {
      if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
        calculateSIQSForLocation(
          lat, 
          lng, 
          locationName, 
          true, 
          bortleScale, 
          seeingConditions,
          undefined,
          setStatusMessage,
          language
        );
      }
    }, 500); // Debounce for better performance
    
    return () => clearTimeout(handler);
  }, [latitude, longitude, locationName, bortleScale, seeingConditions, language, calculateSIQSForLocation, setStatusMessage]);
  
  const handleCalculate = () => {
    if (!validateInputs(locationName, latitude, longitude, language)) {
      setStatusMessage(language === 'en' 
        ? "Please enter a valid location with coordinates." 
        : "请输入有效的位置和坐标。");
      return;
    }
    
    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);
    
    calculateSIQSForLocation(
      lat, 
      lng, 
      locationName, 
      false, 
      bortleScale, 
      seeingConditions, 
      setLoading, 
      setStatusMessage,
      language
    );
  };
  
  return (
    <div className={`glassmorphism-strong rounded-xl p-6 ${className} shadow-lg hover:shadow-xl transition-all duration-300`}>
      <SIQSCalculatorHeader />
      
      <StatusMessage message={statusMessage} />
      
      {siqsScore !== null && <SIQSScore siqsScore={siqsScore} />}
      
      <div className="space-y-4">
        <LocationSelector 
          locationName={locationName} 
          loading={loading} 
          handleUseCurrentLocation={handleUseCurrentLocation}
          onSelectLocation={handleLocationSelect}
        />
        
        <div className="pt-2 pb-2">
          <hr className="border-cosmic-800/30" />
        </div>
        
        {!hideRecommendedPoints && (
          <RecommendedPhotoPoints 
            onSelectPoint={handleRecommendedPointSelect}
            userLocation={userLocation}
          />
        )}
        
        {locationName && (
          <div className="space-y-4 animate-fade-in">
            <AdvancedSettings 
              showAdvancedSettings={showAdvancedSettings}
              setShowAdvancedSettings={setShowAdvancedSettings}
              bortleScale={bortleScale}
              setBortleScale={setBortleScale}
              seeingConditions={seeingConditions}
              setSeeingConditions={setSeeingConditions}
            />
            
            <CalculateButton 
              loading={loading} 
              onClick={handleCalculate}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default SIQSCalculator;
