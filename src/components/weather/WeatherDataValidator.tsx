
import React, { useEffect, useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { validateWeatherData } from "@/utils/validation/dataValidation";
import { synchronizeWeatherWithForecast } from "@/utils/validation/weatherDataSync";
import { useLanguage } from "@/contexts/LanguageContext";

interface WeatherDataValidatorProps {
  weatherData: any;
  forecastData?: any;
  onValidatedData?: (data: any) => void;
  children: (data: any) => React.ReactNode;
}

/**
 * Component that validates weather data against forecast data
 * and provides the validated data to its children
 */
const WeatherDataValidator: React.FC<WeatherDataValidatorProps> = ({
  weatherData,
  forecastData,
  onValidatedData,
  children
}) => {
  const [validatedData, setValidatedData] = useState(weatherData);
  const { toast } = useToast();
  const { t } = useLanguage();
  
  useEffect(() => {
    if (validateWeatherData(weatherData)) {
      // First update with the incoming weather data
      setValidatedData(weatherData);
      
      // Then check if we need to synchronize with forecast
      if (forecastData) {
        try {
          const { updatedData, wasUpdated, discrepancies } = synchronizeWeatherWithForecast(
            weatherData,
            forecastData
          );
          
          if (wasUpdated) {
            console.log("Weather data synchronized with forecast:", discrepancies);
            setValidatedData(updatedData);
            
            // Notify parent component
            if (onValidatedData) {
              onValidatedData(updatedData);
            }
            
            // Show toast if there are significant discrepancies
            if (discrepancies && discrepancies.length > 2) {
              toast({
                title: t("Weather Data Updated", "天气数据已更新"),
                description: t(
                  "Weather data has been updated to match current forecast.",
                  "天气数据已更新以匹配当前预报。"
                ),
                duration: 3000,
              });
            }
          }
        } catch (error) {
          console.error("Error validating weather data:", error);
        }
      }
    } else {
      console.warn("Invalid weather data detected:", weatherData);
      setValidatedData(weatherData); // Still use what we have
    }
  }, [weatherData, forecastData, toast, t, onValidatedData]);
  
  // Render children with validated data
  return <>{children(validatedData)}</>;
};

export default WeatherDataValidator;
