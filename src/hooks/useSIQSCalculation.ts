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
import { cameraBrightnessToBortleEnhanced, cameraBrightnessToMpsasEnhanced } from "@/utils/bortleNowUtils";

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
  } = useQuery({
    queryKey: ["weather", debouncedLatitude, debouncedLongitude],
    queryFn: () => {
      if (debouncedLatitude && debouncedLongitude) {
        return fetchWeatherData(debouncedLatitude, debouncedLongitude);
      }
      return null;
    },
    enabled: !noAutoLocationRequest && !!debouncedLatitude && !!debouncedLongitude,
    retry: false,
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
    onSuccess: (data) => {
      setWeatherData(data?.weatherData || null);
      setForecastData(data?.forecastData || null);
    },
    onError: (error) => {
      console.error("Error fetching weather data:", error);
    }
  });
  
  /**
   * Updates the sky brightness measurement and saves it to local storage
   * Enhanced with MPSAS and Bortle conversion
   */
  const updateSkyBrightness = useCallback((value: number) => {
    // Use our enhanced algorithms for more accurate conversions
    const mpsas = cameraBrightnessToMpsasEnhanced(value);
    const bortle = cameraBrightnessToBortleEnhanced(value);
    const timestamp = new Date().toISOString();
    
    console.log(`Camera measurement: ${value}, MPSAS: ${mpsas.toFixed(2)}, Bortle: ${bortle.toFixed(1)}`);
    
    const newSkyBrightness = {
      value,
      mpsas,
      bortle,
      timestamp
    };
    
    setSkyBrightness(newSkyBrightness);
    
    // Save to local storage
    localStorage.setItem('sky_brightness_measurement', JSON.stringify(newSkyBrightness));
    
    // Update Bortle scale to use the camera measurement
    setBortleScale(bortle);
    
    return bortle;
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
          
          // If no camera measurement is provided, use the stored one
          if (cameraMeasurement === null) {
            // If the stored brightness has a bortle value, use it
            if (parsedBrightness.bortle) {
              setBortleScale(parsedBrightness.bortle);
            } 
            // Otherwise calculate it
            else {
              const bortle = cameraBrightnessToBortleEnhanced(parsedBrightness.value);
              setBortleScale(bortle);
            }
          }
        }
      } catch (e) {
        console.error("Error parsing sky brightness measurement:", e);
      }
    }
  }, [cameraMeasurement]);
  
  // Handle updates when cameraMeasurement changes
  useEffect(() => {
    if (cameraMeasurement !== null) {
      const bortle = updateSkyBrightness(cameraMeasurement);
      // Update bortle scale from camera measurement
      setBortleScale(bortle);
    }
  }, [cameraMeasurement, updateSkyBrightness]);
  
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
   * Now prioritizes camera measurements over database lookups
   */
  useEffect(() => {
    const updateBortle = async () => {
      // If we have a camera measurement, it takes precedence
      if (cameraMeasurement !== null) {
        const bortle = cameraBrightnessToBortleEnhanced(cameraMeasurement);
        setBortleScale(bortle);
        return;
      }
      
      // If we have a stored sky brightness, use it as a priority
      if (skyBrightness?.value !== undefined) {
        const bortle = cameraBrightnessToBortleEnhanced(skyBrightness.value);
        setBortleScale(bortle);
        return;
      }
      
      // Only fall back to location-based Bortle if no direct measurements are available
      if (debouncedLatitude && debouncedLongitude && locationName) {
        try {
          const newBortleScale = await updateBortleScale(
            debouncedLatitude,
            debouncedLongitude,
            locationName,
            bortleScale,
            null // No camera measurement here, we handled that above
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
