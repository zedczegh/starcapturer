import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Cloud, CloudDrizzle, CloudFog, CloudLightning, CloudRain, CloudSnow, Moon, Sun, Thermometer } from "lucide-react";

interface WeatherConditionsProps {
  weatherData: {
    temperature: number;
    humidity: number;
    cloudCover: number;
    windSpeed: number;
    precipitation: number;
    condition: string;
  };
  moonPhase: string | number;
  bortleScale: number;
  seeingConditions: string | number;
}

const WeatherConditions: React.FC<WeatherConditionsProps> = ({
  weatherData,
  moonPhase,
  bortleScale,
  seeingConditions,
}) => {
  const getWeatherIcon = (condition: string) => {
    switch (condition.toLowerCase()) {
      case "clear":
        return <Sun className="h-5 w-5 text-yellow-400" />;
      case "partly cloudy":
        return <Cloud className="h-5 w-5 text-gray-400" />;
      case "cloudy":
        return <Cloud className="h-5 w-5 text-gray-500" />;
      case "overcast":
        return <Cloud className="h-5 w-5 text-gray-600" />;
      case "fog":
        return <CloudFog className="h-5 w-5 text-gray-300" />;
      case "rain":
        return <CloudRain className="h-5 w-5 text-blue-400" />;
      case "drizzle":
        return <CloudDrizzle className="h-5 w-5 text-blue-300" />;
      case "thunderstorm":
        return <CloudLightning className="h-5 w-5 text-yellow-500" />;
      case "snow":
        return <CloudSnow className="h-5 w-5 text-blue-100" />;
      default:
        return <Sun className="h-5 w-5 text-yellow-400" />;
    }
  };

  const formatCondition = (condition: string) => {
    if (!condition) return "Clear";
    
    return condition
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  const getBortleDescription = (scale: number) => {
    switch(scale) {
      case 1: return "Excellent dark sky (rural)";
      case 2: return "Truly dark sky";
      case 3: return "Rural sky";
      case 4: return "Rural/suburban transition";
      case 5: return "Suburban sky";
      case 6: return "Bright suburban sky";
      case 7: return "Suburban/urban transition";
      case 8: return "City sky";
      case 9: return "Inner city sky";
      default: return "Unknown";
    }
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-xl">Observing Conditions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center">
              {getWeatherIcon(weatherData.condition)}
              <span className="ml-2 text-sm">{formatCondition(weatherData.condition)}</span>
            </div>
            <div className="flex items-center">
              <Thermometer className="h-5 w-5 text-red-400" />
              <span className="ml-2 text-sm">{weatherData.temperature}°C</span>
            </div>
            <div className="flex items-center">
              <svg className="h-5 w-5 text-blue-400" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 21.5C16.1421 21.5 19.5 18.1421 19.5 14C19.5 9.85786 12 2.5 12 2.5C12 2.5 4.5 9.85786 4.5 14C4.5 18.1421 7.85786 21.5 12 21.5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span className="ml-2 text-sm">{weatherData.humidity}% humidity</span>
            </div>
            <div className="flex items-center">
              <svg className="h-5 w-5 text-blue-300" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M17.7 7.70006L12 2.00006M12 2.00006L6.3 7.70006M12 2.00006V16.0001M2 12.0001V15.0001C2 18.3001 4.7 22.0001 12 22.0001C19.3 22.0001 22 18.3001 22 15.0001V12.0001" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span className="ml-2 text-sm">{weatherData.windSpeed} km/h wind</span>
            </div>
          </div>

          <div className="pt-2 border-t border-border">
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center">
                <Moon className="h-5 w-5 text-gray-300" />
                <span className="ml-2 text-sm">Moon: {moonPhase}</span>
              </div>
              <div className="flex items-center">
                <svg className="h-5 w-5 text-indigo-400" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 3V5M12 19V21M3 12H5M19 12H21M18.364 5.63604L16.95 7.04999M7.05 16.95L5.636 18.364M16.95 16.95L18.364 18.364M7.05 7.04999L5.636 5.63604" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="2"/>
                </svg>
                <span className="ml-2 text-sm">Seeing: {seeingConditions}</span>
              </div>
              <div className="flex items-center col-span-2">
                <svg className="h-5 w-5 text-yellow-300" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2V6M12 18V22M6 12H2M22 12H18M19 5L16 8M8 16L5 19M19 19L16 16M8 8L5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="2"/>
                </svg>
                <span className="ml-2 text-sm">Bortle Scale: {bortleScale}/9 ({getBortleDescription(bortleScale)})</span>
              </div>
            </div>
          </div>

          <div className="text-xs text-muted-foreground pt-2">
            {bortleScale <= 3 ? (
              <p>Excellent dark sky conditions for astrophotography.</p>
            ) : bortleScale <= 5 ? (
              <p>Moderate light pollution. Suitable for most deep-sky imaging with filters.</p>
            ) : bortleScale <= 7 ? (
              <p>Significant light pollution. Consider narrow-band filters for deep-sky imaging.</p>
            ) : (
              <p>High light pollution. Best for planetary imaging, bright stars, and the Moon.</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default WeatherConditions;
