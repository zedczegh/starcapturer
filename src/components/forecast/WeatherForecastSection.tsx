
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
    if (locationData?.latitude && locationData?.longitude) {
      setLoading(true);
      fetchForecastData(locationData.latitude, locationData.longitude)
        .then(data => {
          setForecast(data);
        })
        .catch(err => {
          console.error("Error fetching forecast:", err);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [locationData?.latitude, locationData?.longitude]);
  
  if (loading) {
    return (
      <div className="bg-cosmic-900/70 p-4 sm:p-6 rounded-lg shadow-lg backdrop-blur-md">
        <h2 className="text-xl font-bold mb-4">
          {language === 'en' ? 'Weather Forecast' : '天气预报'}
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-24 rounded-lg bg-cosmic-800/50" />
          ))}
        </div>
      </div>
    );
  }
  
  if (!forecast || !forecast.hourly) {
    return null;
  }
  
  return (
    <div className="bg-cosmic-900/70 p-4 sm:p-6 rounded-lg shadow-lg backdrop-blur-md">
      <h2 className="text-xl font-bold mb-4">
        {language === 'en' ? 'Weather Forecast' : '天气预报'}
      </h2>
      <div className="overflow-x-auto">
        <div className="inline-flex space-x-4 pb-4 min-w-max">
          {forecast.hourly.slice(0, 8).map((hour: any, index: number) => {
            const time = new Date(hour.time || Date.now());
            const hourTime = time.getHours();
            const formattedHour = hourTime < 10 ? `0${hourTime}:00` : `${hourTime}:00`;
            
            const WeatherIcon = getWeatherIcon(hour.condition || 'cloudy');
            
            return (
              <Card key={index} className="w-24 p-3 text-center">
                <div className="text-sm font-medium mb-1">{formattedHour}</div>
                <WeatherIcon className="mx-auto w-8 h-8 mb-1" />
                <div className="text-sm">{Math.round(hour.temperature)}°</div>
                <div className="text-xs text-muted-foreground">
                  {hour.cloudCover ? `${hour.cloudCover}%` : ''}
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default WeatherForecastSection;
