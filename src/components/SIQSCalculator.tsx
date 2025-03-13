import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { Loader2 } from "lucide-react";
import RecommendedPhotoPoints from "./RecommendedPhotoPoints";
import { useCurrentLocation, useLocationDataCache } from "@/hooks/useLocationData";
import { useSIQSCalculation } from "@/hooks/useSIQSCalculation";
import LocationSelector from "./siqs/LocationSelector";
import SIQSScore from "./siqs/SIQSScore";
import AdvancedSettings from "./siqs/AdvancedSettings";

import { fetchLightPollutionData } from "@/lib/api";
import { estimateBortleScale } from "@/hooks/useLocationData";

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
  const [seeingConditions, setSeeingConditions] = useState(2);
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);
  
  const { setCachedData, getCachedData } = useLocationDataCache();
  
  const {
    userLocation,
    locationName,
    latitude,
    longitude,
    bortleScale,
    statusMessage,
    setLocationName,
    setLatitude,
    setLongitude,
    setBortleScale,
    setStatusMessage,
    handleUseCurrentLocation
  } = useCurrentLocation(language, noAutoLocationRequest);

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
  }, [latitude, longitude, locationName, bortleScale, seeingConditions, language]);
  
  const handleLocationSelect = useCallback(async (location: { name: string; latitude: number; longitude: number; placeDetails?: string }) => {
    setLocationName(location.name);
    setLatitude(location.latitude.toFixed(6));
    setLongitude(location.longitude.toFixed(6));
    
    const cacheKey = `loc-${location.latitude.toFixed(4)}-${location.longitude.toFixed(4)}`;
    const cachedData = getCachedData(cacheKey);
    
    if (cachedData && cachedData.bortleScale) {
      setBortleScale(cachedData.bortleScale);
      setStatusMessage(t("Selected location: ", "已选择位置：") + location.name);
      setShowAdvancedSettings(true);
      return;
    }
    
    try {
      const lightPollutionData = await fetchLightPollutionData(location.latitude, location.longitude);
      if (lightPollutionData && lightPollutionData.bortleScale) {
        setBortleScale(lightPollutionData.bortleScale);
        console.log("Got Bortle scale for selected location:", lightPollutionData.bortleScale);
        
        setCachedData(cacheKey, {
          name: location.name,
          bortleScale: lightPollutionData.bortleScale
        });
      }
    } catch (error) {
      console.error("Error fetching light pollution data for selected location:", error);
      const estimatedBortleScale = estimateBortleScale(location.name);
      setBortleScale(estimatedBortleScale);
    }
    
    setStatusMessage(t("Selected location: ", "已选择位置：") + location.name);
    setShowAdvancedSettings(true);
  }, [t, setCachedData, getCachedData, setLocationName, setLatitude, setLongitude, setBortleScale, setStatusMessage]);
  
  const handleRecommendedPointSelect = (point: { name: string; latitude: number; longitude: number }) => {
    setLocationName(point.name);
    setLatitude(point.latitude.toFixed(6));
    setLongitude(point.longitude.toFixed(6));
    
    setShowAdvancedSettings(true);
    setStatusMessage(t("Selected recommended location: ", "已选择推荐位置：") + point.name);
  };
  
  const handleCalculate = useCallback(() => {
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
  }, [latitude, longitude, locationName, bortleScale, seeingConditions, validateInputs, calculateSIQSForLocation, language]);
  
  return (
    <div className={`glassmorphism rounded-xl p-6 ${className}`}>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold">
          {t("Calculate Stellar Imaging Quality Score", "计算恒星成像质量评分")}
        </h2>
      </div>
      
      {statusMessage && (
        <div className="mb-4 p-3 bg-background/70 border border-border rounded-md text-sm">
          {statusMessage}
        </div>
      )}
      
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
            
            <Button
              type="button"
              onClick={handleCalculate}
              disabled={loading}
              className="w-full mt-4 bg-gradient-to-r from-primary/80 to-primary hover:opacity-90 transition-all duration-200"
            >
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                t("See More Details", "查看更多详情")
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SIQSCalculator;
