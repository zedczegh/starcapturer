
import React, { useState, useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useGeolocation } from "@/hooks/location/useGeolocation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { MapPin } from "lucide-react";
import LocationSearch from "@/components/location/LocationSearch";
import SIQSScore from "@/components/siqs/SIQSScore";
import { validateCoordinates } from "@/utils/coordinateUtils";
import { getLocationNameFromCoordinates } from "@/lib/api/location";
import { fetchWeatherData } from "@/lib/api/weather";
import { fetchLightPollutionData } from "@/lib/api/pollution";
import { fetchForecastData } from "@/lib/api/forecast";
import { calculateNighttimeSiqs } from "@/utils/nighttimeSIQS";
import { getCurrentTimeFormatted } from "@/lib/utils";
import useSiqsUpdater from "@/hooks/siqs/useSiqsUpdater";

export interface SIQSCalculatorProps {
  className?: string;
  noAutoLocationRequest?: boolean;
  onSiqsCalculated?: (value: number | null) => void;
  initialSiqs?: number | null;
}

const SIQSCalculator: React.FC<SIQSCalculatorProps> = ({ 
  className = "",
  noAutoLocationRequest = false,
  onSiqsCalculated,
  initialSiqs = null
}) => {
  const { t, language } = useLanguage();
  const { coords, getPosition, error: locationError } = useGeolocation({
    enableHighAccuracy: true,
    timeout: 5000
  });
  
  const [locationData, setLocationData] = useState({
    name: "",
    chineseName: "",
    latitude: 0,
    longitude: 0,
    bortleScale: 4,
    siqsResult: null,
    timestamp: ""
  });
  
  const [isCalculating, setIsCalculating] = useState(false);
  const [weatherData, setWeatherData] = useState(null);
  const [forecastData, setForecastData] = useState(null);
  const [forecastLoading, setForecastLoading] = useState(false);
  
  // Use the SIQS updater hook to handle SIQS value management
  const { siqsScore, updateSiqsValue } = useSiqsUpdater({
    initialSiqs: initialSiqs,
    locationId: `loc-${locationData.latitude.toFixed(6)}-${locationData.longitude.toFixed(6)}`,
    latitude: locationData.latitude,
    longitude: locationData.longitude
  });
  
  // Request location if not auto-disabled
  useEffect(() => {
    if (!noAutoLocationRequest) {
      getPosition();
    }
  }, [getPosition, noAutoLocationRequest]);
  
  // Update location and calculate SIQS when coordinates change
  useEffect(() => {
    if (coords && coords.latitude && coords.longitude) {
      console.log(`SIQSCalculator: Got coordinates ${coords.latitude}, ${coords.longitude}`);
      
      handleLocationUpdate({
        latitude: coords.latitude,
        longitude: coords.longitude
      });
    }
  }, [coords]);
  
  // Handle selected location from search
  const handleLocationSelected = async (location: any) => {
    if (location && location.latitude && location.longitude) {
      console.log(`SIQSCalculator: Selected location ${location.latitude}, ${location.longitude}`);
      
      await handleLocationUpdate({
        latitude: location.latitude,
        longitude: location.longitude,
        name: location.name || "",
        chineseName: location.chineseName || ""
      });
    }
  };
  
  // Update location data and fetch related information
  const handleLocationUpdate = async (location: any) => {
    if (!location || !validateCoordinates(location.latitude, location.longitude)) {
      console.error("Invalid coordinates provided to handleLocationUpdate");
      return;
    }
    
    try {
      // Start calculation process
      setIsCalculating(true);
      
      // Reset siqs before starting new calculation
      updateSiqsValue(null);
      if (onSiqsCalculated) onSiqsCalculated(null);
      
      // Update location with provided data
      setLocationData(prev => ({
        ...prev,
        latitude: location.latitude,
        longitude: location.longitude,
        name: location.name || prev.name,
        chineseName: location.chineseName || prev.chineseName,
        timestamp: getCurrentTimeFormatted()
      }));
      
      // If no name provided, fetch it
      if (!location.name) {
        try {
          const locationName = await getLocationNameFromCoordinates(
            location.latitude, 
            location.longitude,
            language
          );
          
          if (locationName) {
            setLocationData(prev => ({
              ...prev,
              name: language === 'en' ? locationName : prev.name,
              chineseName: language === 'zh' ? locationName : prev.chineseName
            }));
          }
        } catch (err) {
          console.error("Error fetching location name:", err);
        }
      }
      
      // Fetch weather data
      const weather = await fetchWeatherData({
        latitude: location.latitude,
        longitude: location.longitude
      });
      
      setWeatherData(weather);
      
      // Fetch light pollution data
      try {
        const pollutionData = await fetchLightPollutionData(
          location.latitude, 
          location.longitude
        );
        
        if (pollutionData && pollutionData.bortleScale) {
          setLocationData(prev => ({
            ...prev,
            bortleScale: pollutionData.bortleScale
          }));
        }
      } catch (err) {
        console.error("Error fetching light pollution data:", err);
      }
      
      // Fetch forecast data
      setForecastLoading(true);
      try {
        const forecast = await fetchForecastData({
          latitude: location.latitude,
          longitude: location.longitude,
          days: 2
        });
        
        setForecastData(forecast);
        
        // Calculate SIQS with nighttime emphasis once forecast data is available
        if (forecast && weather) {
          const updatedLocationData = {
            ...locationData,
            latitude: location.latitude,
            longitude: location.longitude,
            bortleScale: locationData.bortleScale,
            weatherData: weather
          };
          
          const siqsResult = calculateNighttimeSiqs(
            updatedLocationData,
            forecast,
            t
          );
          
          if (siqsResult) {
            console.log(`SIQSCalculator: Calculated SIQS is ${siqsResult.score}`);
            
            // Update location data with SIQS result
            setLocationData(prev => ({
              ...prev,
              siqs: siqsResult.score,
              siqsResult
            }));
            
            // Update external state via callback
            if (onSiqsCalculated) onSiqsCalculated(siqsResult.score);
            updateSiqsValue(siqsResult.score);
          }
        }
      } catch (err) {
        console.error("Error fetching forecast data:", err);
        toast.error(t("Error fetching forecast data", "获取预报数据时出错"));
      } finally {
        setForecastLoading(false);
        setIsCalculating(false);
      }
    } catch (err) {
      console.error("Error in handleLocationUpdate:", err);
      setIsCalculating(false);
    }
  };
  
  // Format coordinates for display
  const formattedCoordinates = locationData.latitude && locationData.longitude 
    ? `${locationData.latitude.toFixed(4)}, ${locationData.longitude.toFixed(4)}` 
    : t("Unknown", "未知");
  
  return (
    <Card className={`overflow-hidden shadow-lg ${className}`}>
      <div className="p-4 md:p-6 space-y-4">
        <div className="space-y-4">
          <LocationSearch 
            onLocationSelected={handleLocationSelected} 
            placeholder={t("Search for a location", "搜索地点")} 
          />
          
          <div className="flex items-center justify-between">
            <div className="flex items-center text-sm text-muted-foreground">
              <MapPin className="w-4 h-4 mr-1 text-muted-foreground" />
              <span>{formattedCoordinates}</span>
            </div>
            
            <Button
              size="sm"
              variant="outline"
              onClick={() => getPosition()}
              disabled={isCalculating}
              className="text-xs"
            >
              {t("Use my location", "使用我的位置")}
            </Button>
          </div>
          
          <SIQSScore
            siqsScore={siqsScore}
            locationName={language === 'en' ? locationData.name : locationData.chineseName || locationData.name}
            latitude={locationData.latitude}
            longitude={locationData.longitude}
          />
        </div>
      </div>
    </Card>
  );
};

export default SIQSCalculator;
