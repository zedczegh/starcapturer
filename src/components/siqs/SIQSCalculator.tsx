
import React, { useState, useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import MapSelector from "@/components/MapSelector";
import LocationPicker from "@/components/location/LocationPicker";
import { calculateSIQSWithWeatherData } from "@/hooks/siqs/siqsCalculationUtils";
import { fetchWeatherData } from "@/lib/api/weather";
import { fetchForecastData } from "@/lib/api/forecast";
import { useWeatherUpdater } from "@/hooks/useWeatherUpdater";
import { useLocationCache } from "@/hooks/location/useLocationCache";

export interface SIQSCalculatorProps {
  onCalculate?: (siqs: number, isViable: boolean) => void;
  onLocationChange?: (location: any) => void;
  noAutoLocationRequest?: boolean;
}

const SIQSCalculator: React.FC<SIQSCalculatorProps> = ({
  onCalculate,
  onLocationChange,
  noAutoLocationRequest = false
}) => {
  const { t, language } = useLanguage();
  const [isCalculating, setIsCalculating] = useState(false);
  const [weatherData, setWeatherData] = useState<any>(null);
  const [siqsScore, setSiqsScore] = useState<number>(0);
  const [siqsResult, setSiqsResult] = useState<any>(null);
  const [selectedLocation, setSelectedLocation] = useState<any>(null);
  const [forecastData, setForecastData] = useState<any>(null);
  const [currentMoonPhase, setCurrentMoonPhase] = useState<number>(0);
  const { loading } = useWeatherUpdater();
  const { getCachedData, setCachedData } = useLocationCache();

  useEffect(() => {
    // Update moon phase based on current day of month (simplified calculation)
    const date = new Date();
    const dayOfMonth = date.getDate();
    const moonCycle = (dayOfMonth % 30) / 30;
    setCurrentMoonPhase(moonCycle);
  }, []);

  // Validate latitude, longitude inputs
  const validateInputs = (
    locationName: string,
    latitude: string,
    longitude: string,
    language: string
  ): boolean => {
    // Check if location name is provided
    if (!locationName) {
      toast.error(
        language === "en"
          ? "Please enter a location name"
          : "请输入位置名称"
      );
      return false;
    }

    // Check if coordinates are valid numbers
    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);
    
    if (isNaN(lat) || isNaN(lng)) {
      toast.error(
        language === "en"
          ? "Please enter valid coordinates"
          : "请输入有效的坐标"
      );
      return false;
    }
    
    // Check if coordinates are in valid range
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      toast.error(
        language === "en"
          ? "Coordinates out of range"
          : "坐标超出范围"
      );
      return false;
    }
    
    return true;
  };

  // Calculate SIQS for a specific location
  const calculateSIQSForLocation = async (
    lat: number,
    lng: number,
    name: string
  ) => {
    try {
      setIsCalculating(true);
      setSiqsScore(0);
      setSiqsResult(null);
      
      // Create a cache key for the location
      const cacheKey = `weather_${lat.toFixed(4)}_${lng.toFixed(4)}`;
      
      // Try to get cached weather data first
      let weatherData = getCachedData(cacheKey, 5 * 60 * 1000); // 5 minutes cache
      
      if (!weatherData) {
        // Fetch fresh weather data if no cache exists
        weatherData = await fetchWeatherData({
          latitude: lat,
          longitude: lng
        });
        
        if (weatherData) {
          setCachedData(cacheKey, weatherData);
        }
      }
      
      // Try to get cached forecast data
      const forecastCacheKey = `forecast_${lat.toFixed(4)}_${lng.toFixed(4)}`;
      let forecastData = getCachedData(forecastCacheKey, 15 * 60 * 1000); // 15 minutes cache
      
      if (!forecastData) {
        // Fetch fresh forecast data if no cache exists
        forecastData = await fetchForecastData({
          latitude: lat,
          longitude: lng,
          days: 2
        });
        
        if (forecastData) {
          setCachedData(forecastCacheKey, forecastData);
        }
      }
      
      setWeatherData(weatherData);
      setForecastData(forecastData);
      
      if (!weatherData) {
        toast.error(
          language === "en"
            ? "Failed to fetch weather data"
            : "获取天气数据失败"
        );
        setIsCalculating(false);
        return;
      }
      
      // Calculate SIQS based on weather data
      const result = await calculateSIQSWithWeatherData(
        weatherData,
        5, // Default Bortle scale if not provided
        3, // Default seeing conditions
        currentMoonPhase,
        forecastData
      );
      
      setSiqsResult(result);
      setSiqsScore(result.score);
      
      // Call the onCalculate callback if provided
      if (onCalculate) {
        onCalculate(result.score, result.isViable);
      }
      
      // Display toast with SIQS score
      toast.success(
        language === "en"
          ? `SIQS Score: ${result.score.toFixed(1)}`
          : `SIQS 评分: ${result.score.toFixed(1)}`
      );
    } catch (error) {
      console.error("Error calculating SIQS:", error);
      toast.error(
        language === "en"
          ? "Error calculating SIQS"
          : "计算 SIQS 时出错"
      );
    } finally {
      setIsCalculating(false);
    }
  };

  // Handle location selection
  const handleLocationSelect = (location: any) => {
    setSelectedLocation(location);
    
    // Call the onLocationChange callback if provided
    if (onLocationChange) {
      onLocationChange(location);
    }
    
    // Auto-calculate SIQS when location is selected
    calculateSIQSForLocation(
      location.latitude,
      location.longitude,
      location.name
    );
  };

  return (
    <Card className="backdrop-blur-sm bg-cosmic-800/40 border-cosmic-700/30 shadow-lg">
      <CardHeader className="pb-2">
        <CardTitle className="text-xl text-center text-gradient-blue">
          {t("SIQS Calculator", "SIQS 计算器")}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">
              {t("Search Location", "搜索地点")}
            </label>
            <MapSelector onLocationSelect={handleLocationSelect} />
          </div>
          
          <div>
            <label className="text-sm font-medium">
              {t("Or Select Your Current Location", "或选择您当前的位置")}
            </label>
            <div className="mt-2">
              <LocationPicker
                onLocationSelect={handleLocationSelect}
                noAutoLocationRequest={noAutoLocationRequest}
                buttonLabel={t("Use My Location", "使用我的位置")}
                buttonVariant="default"
                className="w-full"
              />
            </div>
          </div>
          
          {selectedLocation && (
            <div className="mt-4 p-3 rounded-md bg-cosmic-900/50 border border-cosmic-700/40">
              <h3 className="font-medium mb-1">
                {t("Selected Location", "已选位置")}
              </h3>
              <p className="text-sm">{selectedLocation.name}</p>
              <p className="text-xs text-muted-foreground">
                {selectedLocation.latitude.toFixed(4)}, {selectedLocation.longitude.toFixed(4)}
              </p>
            </div>
          )}
          
          <Button
            className="w-full mt-4"
            disabled={isCalculating || !selectedLocation}
            onClick={() => {
              if (selectedLocation) {
                calculateSIQSForLocation(
                  selectedLocation.latitude,
                  selectedLocation.longitude,
                  selectedLocation.name
                );
              }
            }}
          >
            {isCalculating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t("Calculating...", "计算中...")}
              </>
            ) : (
              t("Calculate SIQS", "计算 SIQS")
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default SIQSCalculator;
