
import React, { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { getWeatherIcon } from "@/utils/weatherIcons";
import { fetchForecastData } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";

interface WeatherForecastSectionProps {
  locationData: any;
  language: string;
}

const WeatherForecastSection: React.FC<WeatherForecastSectionProps> = ({
  locationData,
  language
}) => {
  const [forecast, setForecast] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    const loadForecast = async () => {
      if (!locationData?.latitude || !locationData?.longitude) return;
      
      setLoading(true);
      try {
        const forecastData = await fetchForecastData({
          latitude: locationData.latitude,
          longitude: locationData.longitude,
          days: 3
        });
        
        setForecast(forecastData);
      } catch (error) {
        console.error("Error fetching forecast:", error);
      } finally {
        setLoading(false);
      }
    };
    
    loadForecast();
  }, [locationData?.latitude, locationData?.longitude]);
  
  if (!locationData?.latitude || !locationData?.longitude) {
    return null;
  }
  
  // Show skeleton during loading
  if (loading) {
    return (
      <div className="bg-cosmic-900/70 p-4 sm:p-6 rounded-lg shadow-lg backdrop-blur-md">
        <h2 className="text-xl font-bold mb-4">{language === 'en' ? 'Weather Forecast' : '天气预报'}</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-32 w-full bg-cosmic-800/30" />
          ))}
        </div>
      </div>
    );
  }
  
  // If forecast failed to load
  if (!forecast?.hourly) {
    return (
      <div className="bg-cosmic-900/70 p-4 sm:p-6 rounded-lg shadow-lg backdrop-blur-md">
        <h2 className="text-xl font-bold mb-4">{language === 'en' ? 'Weather Forecast' : '天气预报'}</h2>
        <p className="text-muted-foreground">
          {language === 'en' ? 'Unable to load forecast data' : '无法加载天气预报数据'}
        </p>
      </div>
    );
  }
  
  // Process forecast to get next 24 hours in 4-hour intervals
  const now = new Date();
  const hourlyData = forecast.hourly;
  const processedForecast = [];
  
  for (let i = 0; i < hourlyData.time.length; i++) {
    const forecastTime = new Date(hourlyData.time[i]);
    
    // Skip past hours
    if (forecastTime < now) continue;
    
    // Take every 4th hour for the next 24 hours
    if (processedForecast.length < 6 && (processedForecast.length === 0 || i % 4 === 0)) {
      const weatherCode = hourlyData.weather_code?.[i] || 0;
      const hour = forecastTime.getHours();
      
      processedForecast.push({
        time: forecastTime,
        hour,
        temperature: hourlyData.temperature_2m?.[i],
        cloudCover: hourlyData.cloud_cover?.[i],
        weatherCode
      });
    }
    
    // Stop after we have 6 items or after 24 hours
    if (processedForecast.length >= 6 || 
        (forecastTime.getTime() - now.getTime()) > 24 * 60 * 60 * 1000) {
      break;
    }
  }
  
  return (
    <div className="bg-cosmic-900/70 p-4 sm:p-6 rounded-lg shadow-lg backdrop-blur-md">
      <h2 className="text-xl font-bold mb-4">
        {language === 'en' ? 'Weather Forecast' : '天气预报'}
      </h2>
      
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
        {processedForecast.map((item, index) => {
          const WeatherIcon = getWeatherIcon(item.weatherCode, item.hour);
          const formattedHour = item.time.toLocaleTimeString(
            language === 'zh' ? 'zh-CN' : 'en-US', 
            { hour: '2-digit', minute: '2-digit' }
          );
          
          return (
            <Card 
              key={index} 
              className="p-3 text-center bg-cosmic-800/30 border-cosmic-700/30 flex flex-col items-center"
            >
              <div className="text-sm text-muted-foreground mb-1">
                {formattedHour}
              </div>
              
              {WeatherIcon && (
                <WeatherIcon className="h-8 w-8 text-primary my-2" />
              )}
              
              {item.temperature !== undefined && (
                <div className="font-semibold">{Math.round(item.temperature)}°C</div>
              )}
              
              {item.cloudCover !== undefined && (
                <div className="text-xs text-muted-foreground mt-1">
                  {language === 'en' ? 'Clouds' : '云量'}: {item.cloudCover}%
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default WeatherForecastSection;
