
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, Lightbulb } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useLanguage } from "@/contexts/LanguageContext";
import ForecastTabs from "@/components/forecast/ForecastTabs";
import CloudCoverageMap from "@/components/location/CloudCoverageMap";
import MapDisplay from "@/components/location/MapDisplay";
import SIQSSummary from "@/components/SIQSSummary";
import PrimaryConditions from "@/components/weather/PrimaryConditions";
import SecondaryConditions from "@/components/weather/SecondaryConditions";
import WarmReminders from "@/components/weather/WarmReminders";
import { detectExtremeWeatherConditions } from "@/components/forecast/ForecastUtils";
import WeatherAlerts from "@/components/weather/WeatherAlerts";

interface LocationContentGridProps {
  locationData: any;
  forecastData: any;
  longRangeForecast: any;
  forecastLoading: boolean;
  longRangeLoading: boolean;
  gettingUserLocation: boolean;
  onLocationUpdate: (location: {
    name: string;
    latitude: number;
    longitude: number;
  }) => Promise<void>;
  setGettingUserLocation: React.Dispatch<React.SetStateAction<boolean>>;
  setStatusMessage: (message: string | null) => void;
  onRefreshForecast: () => void;
  onRefreshLongRange: () => void;
}

const LocationContentGrid: React.FC<LocationContentGridProps> = ({
  locationData,
  forecastData,
  longRangeForecast,
  forecastLoading,
  longRangeLoading,
  onRefreshForecast,
  onRefreshLongRange,
}) => {
  const { t } = useLanguage();
  
  // Generate weather alerts
  const weatherAlerts = React.useMemo(() => {
    if (!forecastData || !forecastData.hourly) return [];
    
    const now = new Date();
    const forecasts = [];
    
    // Prepare data for alert detection
    for (let i = 0; i < forecastData.hourly.time.length; i++) {
      const forecastTime = new Date(forecastData.hourly.time[i]);
      
      // Only include future forecasts
      if (forecastTime > now) {
        forecasts.push({
          time: forecastData.hourly.time[i],
          weatherCode: forecastData.hourly.weather_code?.[i],
          windSpeed: forecastData.hourly.wind_speed_10m?.[i],
          precipitation: forecastData.hourly.precipitation?.[i],
          temperature: forecastData.hourly.temperature_2m?.[i]
        });
      }
    }
    
    return detectExtremeWeatherConditions(forecasts, t);
  }, [forecastData, t]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {/* SIQS Summary */}
      <Card className="shadow-md lg:col-span-1">
        <CardHeader className="pb-2 bg-gradient-to-r from-cosmic-900 to-cosmic-800 border-b border-cosmic-700/30">
          <CardTitle className="text-lg text-gradient-blue">{t("SIQS Score", "SIQS评分")}</CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <SIQSSummary 
            siqsResult={locationData.siqsResult}
            weatherData={locationData.weatherData}
            locationData={locationData}
          />
        </CardContent>
      </Card>

      {/* Primary Weather Conditions */}
      <Card className="shadow-md">
        <CardHeader className="pb-2 bg-gradient-to-r from-cosmic-900 to-cosmic-800 border-b border-cosmic-700/30">
          <CardTitle className="text-lg text-gradient-blue">{t("Current Conditions", "当前状况")}</CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <PrimaryConditions weatherData={locationData.weatherData} />
        </CardContent>
      </Card>

      {/* Secondary Weather Conditions */}
      <Card className="shadow-md">
        <CardHeader className="pb-2 bg-gradient-to-r from-cosmic-900 to-cosmic-800 border-b border-cosmic-700/30">
          <CardTitle className="text-lg text-gradient-blue">{t("Astronomy Factors", "天文因素")}</CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <SecondaryConditions weatherData={locationData.weatherData} />
        </CardContent>
      </Card>

      {/* Cloud Coverage Map */}
      <div className="md:col-span-1 lg:col-span-1">
        <CloudCoverageMap 
          latitude={locationData.latitude}
          longitude={locationData.longitude}
        />
      </div>

      {/* Warm Reminders */}
      <div className="md:col-span-1 lg:col-span-1">
        <WarmReminders 
          weatherData={locationData.weatherData}
          forecastData={forecastData}
          locationData={locationData}
          longRangeForecast={longRangeForecast}
        />
      </div>
      
      {/* Weather Alerts */}
      {weatherAlerts.length > 0 && (
        <div className="md:col-span-1 lg:col-span-1">
          <WeatherAlerts alerts={weatherAlerts} />
        </div>
      )}

      {/* Location Map */}
      <div className="md:col-span-2 lg:col-span-3">
        <Card className="shadow-md">
          <CardHeader className="pb-2 bg-gradient-to-r from-cosmic-900 to-cosmic-800 border-b border-cosmic-700/30">
            <CardTitle className="flex items-center text-lg text-gradient-blue">
              <MapPin className="mr-2 h-4 w-4" />
              {t("Location", "位置")}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <MapDisplay 
              locationData={{
                latitude: locationData.latitude,
                longitude: locationData.longitude,
                name: locationData.name
              }}
            />
          </CardContent>
        </Card>
      </div>

      {/* Weather Forecast */}
      <div className="md:col-span-2 lg:col-span-3">
        <ForecastTabs 
          forecastData={forecastData}
          longRangeForecast={longRangeForecast}
          forecastLoading={forecastLoading}
          longRangeLoading={longRangeLoading}
          onRefreshForecast={onRefreshForecast}
          onRefreshLongRange={onRefreshLongRange}
        />
      </div>
    </div>
  );
};

export default LocationContentGrid;
