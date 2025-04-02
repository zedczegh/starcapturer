import { useState, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchWeatherData } from "@/lib/api";
import { calculateSIQSWithWeatherData } from "@/hooks/siqs/siqsCalculationUtils";
import { useDebounce } from "@/hooks/useDebounce";
import { useLanguage } from "@/contexts/LanguageContext";
import { useLocation } from "@/contexts/LocationContext";
import { useBortleUpdater } from "@/hooks/location/useBortleUpdater";
import { currentSiqsStore } from "@/components/index/CalculatorSection";
import { rawBrightnessToMpsas } from "@/utils/darkSkyMeterUtils";

interface UseSIQSCalculationProps {
  latitude?: number | null;
  longitude?: number | null;
  locationName?: string | null;
  noAutoLocationRequest?: boolean;
  cameraMeasurement?: number | null;
}

/**
 * Hook for calculating SIQS (Sky Quality Index for Stargazing) based on weather data,
 * location, and user preferences. It uses React Query for efficient data fetching and caching.
 */
export function useSIQSCalculation({
  latitude,
  longitude,
  locationName,
  noAutoLocationRequest = false,
  cameraMeasurement = null
}: UseSIQSCalculationProps) {
  const { t } = useLanguage();
  const {
    bortleScale: contextBortleScale,
    seeingConditions: contextSeeingConditions,
    moonPhase: contextMoonPhase,
    updateLocationData,
    locationData
  } = useLocation();
  
  const { updateBortleScale } = useBortleUpdater();
  
  const [bortleScale, setBortleScale] = useState<number | null>(contextBortleScale || null);
  const [seeingConditions, setSeeingConditions] = useState<number>(contextSeeingConditions);
  const [moonPhase, setMoonPhase] = useState<number>(contextMoonPhase);
  const [siqsResult, setSiqsResult] = useState<any>(null);
  const [weatherData, setWeatherData] = useState<any>(null);
  const [forecastData, setForecastData] = useState<any>(null);
  const [skyBrightness, setSkyBrightness] = useState<{ value: number; mpsas?: number; timestamp?: string } | null>(null);
  
  // Debounced updates for location data
  const debouncedLatitude = useDebounce(latitude, 500);
  const debouncedLongitude = useDebounce(longitude, 500);
  
  // Fetch weather data using React Query
  const {
    data: weatherQueryData,
    isLoading: weatherLoading,
    error: weatherError,
    refetch: refetchWeather
  } = useQuery(
    ["weather", debouncedLatitude, debouncedLongitude],
    () => {
      if (debouncedLatitude && debouncedLongitude) {
        return fetchWeatherData(debouncedLatitude, debouncedLongitude);
      }
      return null;
    },
    {
      enabled: !noAutoLocationRequest && !!debouncedLatitude && !!debouncedLongitude,
      retry: false,
      refetchOnWindowFocus: false,
      onSuccess: (data) => {
        setWeatherData(data?.weatherData || null);
        setForecastData(data?.forecastData || null);
      },
      onError: (error) => {
        console.error("Error fetching weather data:", error);
      }
    }
  );
  
  /**
   * Updates the sky brightness measurement and saves it to local storage
   */
  const updateSkyBrightness = useCallback((value: number) => {
    const mpsas = rawBrightnessToMpsas(value);
    const timestamp = new Date().toISOString();
    
    const newSkyBrightness = {
      value,
      mpsas,
      timestamp
    };
    
    setSkyBrightness(newSkyBrightness);
    
    // Save to local storage
    localStorage.setItem('sky_brightness_measurement', JSON.stringify(newSkyBrightness));
  }, []);
  
  /**
   * Load sky brightness measurement from local storage on component mount
   */
  useEffect(() => {
    const storedBrightness = localStorage.getItem('sky_brightness_measurement');
    if (storedBrightness) {
      try {
        const parsedBrightness = JSON.parse(storedBrightness);
        if (parsedBrightness && typeof parsedBrightness.value === 'number') {
          setSkyBrightness(parsedBrightness);
        }
      } catch (e) {
        console.error("Error parsing sky brightness measurement:", e);
      }
    }
  }, []);
  
  /**
   * Updates the SIQS result based on weather data, Bortle scale, seeing conditions, and moon phase
   */
  useEffect(() => {
    if (weatherData && bortleScale !== null) {
      const calculateSIQS = async () => {
        try {
          const siqs = await calculateSIQSWithWeatherData(
            weatherData,
            bortleScale,
            seeingConditions,
            moonPhase,
            forecastData
          );
          
          if (siqs) {
            setSiqsResult(siqs);
            currentSiqsStore.setValue(siqs.score);
          }
        } catch (error) {
          console.error("Error calculating SIQS:", error);
        }
      };
      
      calculateSIQS();
    }
  }, [weatherData, bortleScale, seeingConditions, moonPhase, forecastData]);
  
  /**
   * Updates the Bortle scale based on location and camera measurement
   */
  useEffect(() => {
    const updateBortle = async () => {
      if (debouncedLatitude && debouncedLongitude && locationName) {
        try {
          const newBortleScale = await updateBortleScale(
            debouncedLatitude,
            debouncedLongitude,
            locationName,
            bortleScale,
            cameraMeasurement !== null ? cameraMeasurement : (skyBrightness?.value || null)
          );
          
          if (newBortleScale !== null) {
            setBortleScale(newBortleScale);
          }
        } catch (error) {
          console.error("Error updating Bortle scale:", error);
        }
      }
    };
    
    updateBortle();
  }, [debouncedLatitude, debouncedLongitude, locationName, cameraMeasurement, skyBrightness?.value, updateBortleScale, bortleScale]);
  
  /**
   * Updates the location data in the context
   */
  useEffect(() => {
    if (debouncedLatitude && debouncedLongitude && locationName) {
      updateLocationData({
        latitude: debouncedLatitude,
        longitude: debouncedLongitude,
        name: locationName,
        bortleScale: bortleScale || 4,
        seeingConditions: seeingConditions,
        weatherData: weatherData,
        siqsResult: siqsResult,
        moonPhase: moonPhase,
        skyBrightness: skyBrightness
      });
    }
  }, [debouncedLatitude, debouncedLongitude, locationName, bortleScale, seeingConditions, weatherData, siqsResult, moonPhase, skyBrightness, updateLocationData]);
  
  /**
   * Provides a function to manually refetch weather data
   */
  const manualRefetchWeather = useCallback(async () => {
    if (debouncedLatitude && debouncedLongitude) {
      await refetchWeather();
    }
  }, [debouncedLatitude, debouncedLongitude, refetchWeather]);
  
  return {
    bortleScale: bortleScale,
    setBortleScale,
    seeingConditions,
    setSeeingConditions,
    moonPhase,
    setMoonPhase,
    siqsResult,
    weatherData,
    weatherLoading,
    weatherError,
    manualRefetchWeather,
    skyBrightness,
    updateSkyBrightness
  };
}
