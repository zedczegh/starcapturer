
import { useState, useEffect, useMemo } from 'react';
import { useToast } from "@/components/ui/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { calculateAstronomicalNight, formatTime } from "@/utils/astronomy/nightTimeCalculator";
import { calculateTonightCloudCover } from "@/utils/nighttimeSIQS";
import { validateWeatherData, validateWeatherAgainstForecast } from "@/utils/validation/dataValidation";
import { getMoonInfo } from '@/services/realTimeSiqs/moonPhaseCalculator';

interface WeatherData {
  temperature: number;
  humidity: number;
  cloudCover: number;
  windSpeed: number;
  precipitation: number;
  time: string;
  condition: string;
  aqi?: number;
  weatherCondition?: string;
}

interface NighttimeCloudData {
  average: number;
  timeRange?: string;
  description?: string;
  evening?: number | null;
  morning?: number | null;
}

interface WeatherValidatorProps {
  weatherData: WeatherData;
  forecastData?: any;
  latitude?: number;
  longitude?: number;
}

export function useWeatherDataValidator({
  weatherData,
  forecastData,
  latitude = 0,
  longitude = 0
}: WeatherValidatorProps) {
  const [stableWeatherData, setStableWeatherData] = useState<WeatherData>(weatherData);
  const { toast } = useToast();
  const { t } = useLanguage();

  // Calculate nighttime cloud data from forecast
  const nighttimeCloudData = useMemo(() => {
    if (!forecastData || !forecastData.hourly) return null;
    
    try {
      const { start, end } = calculateAstronomicalNight(latitude, longitude);
      const nightTimeStr = `${formatTime(start)}-${formatTime(end)}`;
      
      // Get cloud cover for tonight from forecast
      const forecastHourly = forecastData.hourly;
      const tonightCloudCover = calculateTonightCloudCover(
        forecastHourly,
        latitude,
        longitude
      );
      
      console.log(`Calculated astronomical night cloud cover: ${tonightCloudCover}%`);
      
      // Check if we have valid data before returning
      if (isNaN(tonightCloudCover)) {
        console.log("Invalid astronomical night cloud cover data");
        return null;
      }
      
      // Split evening and morning times if possible
      let eveningCloudCover = null;
      let morningCloudCover = null;
      
      if (forecastHourly.time && forecastHourly.cloud_cover) {
        // Calculate evening cloud cover (6pm-12am)
        const eveningTimes = forecastHourly.time.filter((time: string) => {
          const date = new Date(time);
          const hour = date.getHours();
          return hour >= 18 && hour <= 23;
        });
        
        if (eveningTimes.length > 0) {
          const eveningValues = eveningTimes.map((time: string) => {
            const index = forecastHourly.time.indexOf(time);
            return forecastHourly.cloud_cover[index];
          }).filter((val: any) => typeof val === 'number' && !isNaN(val));
          
          if (eveningValues.length > 0) {
            eveningCloudCover = eveningValues.reduce((sum: number, val: number) => sum + val, 0) / eveningValues.length;
          }
        }
        
        // Calculate morning cloud cover (12am-6am)
        const morningTimes = forecastHourly.time.filter((time: string) => {
          const date = new Date(time);
          const hour = date.getHours();
          return hour >= 0 && hour < 6;
        });
        
        if (morningTimes.length > 0) {
          const morningValues = morningTimes.map((time: string) => {
            const index = forecastHourly.time.indexOf(time);
            return forecastHourly.cloud_cover[index];
          }).filter((val: any) => typeof val === 'number' && !isNaN(val));
          
          if (morningValues.length > 0) {
            morningCloudCover = morningValues.reduce((sum: number, val: number) => sum + val, 0) / morningValues.length;
          }
        }
      }
      
      return {
        average: tonightCloudCover,
        timeRange: nightTimeStr,
        description: t ? 
          t("Astronomical Night Cloud Cover", "天文夜云量") : 
          "Astronomical Night Cloud Cover",
        evening: eveningCloudCover,
        morning: morningCloudCover
      };
    } catch (error) {
      console.error("Error calculating nighttime cloud cover:", error);
      return null;
    }
  }, [forecastData, latitude, longitude, t]);
  
  // Validate weather data against forecast
  useEffect(() => {
    if (forecastData && validateWeatherData(weatherData)) {
      const { isValid, correctedData, discrepancies } = validateWeatherAgainstForecast(
        weatherData,
        forecastData
      );
      
      if (!isValid && correctedData && discrepancies) {
        console.log("Weather data discrepancies detected:", discrepancies);
        
        setStableWeatherData(correctedData);
        
        if (discrepancies.length > 2) {
          toast({
            title: t("Weather Data Updated", "天气数据已更新"),
            description: t(
              "Weather data has been updated to match current forecast.",
              "天气数据已更新以匹配当前预报。"
            ),
            duration: 3000,
          });
        }
      } else {
        setStableWeatherData(weatherData);
      }
    } else if (validateWeatherData(weatherData)) {
      setStableWeatherData(weatherData);
    }
  }, [weatherData, forecastData, toast, t]);

  // Get moon info
  const { name: calculatedMoonPhaseName } = getMoonInfo();

  return {
    stableWeatherData,
    nighttimeCloudData,
    moonInfo: {
      phaseName: calculatedMoonPhaseName
    }
  };
}
