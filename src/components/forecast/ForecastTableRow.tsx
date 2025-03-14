
import React from "react";
import { TableCell, TableRow } from "@/components/ui/table";
import { useLanguage } from "@/contexts/LanguageContext";
import { 
  DynamicTemperatureIcon, 
  DynamicCloudCoverIcon, 
  DynamicWindIcon, 
  DynamicHumidityIcon,
  DynamicPrecipitationIcon 
} from "@/components/weather/DynamicIcons";
import { getSIQSRating, formatCondition } from "./ForecastUtils";

interface ForecastTableRowProps {
  forecast: any;
  index: number;
}

const ForecastTableRow: React.FC<ForecastTableRowProps> = ({ forecast, index }) => {
  const { t } = useLanguage();
  
  const formatTime = (isoTime: string) => {
    try {
      const date = new Date(isoTime);
      if (isNaN(date.getTime())) return "--:--";
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (error) {
      console.error("Error formatting time:", error);
      return "--:--";
    }
  };
  
  const formatDate = (isoTime: string) => {
    try {
      const date = new Date(isoTime);
      if (isNaN(date.getTime())) return "--/--";
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    } catch (error) {
      console.error("Error formatting date:", error);
      return "--/--";
    }
  };

  const getWeatherClass = (precipitation: number, cloudCover: number) => {
    if (precipitation > 0.5) return "bg-red-500/10 animate-pulse";
    if (cloudCover < 20) return "bg-green-500/10 animate-pulse";
    return "";
  };
  
  const siqs = getSIQSRating(forecast.cloudCover, forecast.windSpeed, forecast.humidity, t);
  const weatherClass = getWeatherClass(forecast.precipitation, forecast.cloudCover);
  
  return (
    <TableRow 
      className={`transition-colors ${index % 2 === 0 ? 'bg-cosmic-700/5' : 'bg-cosmic-700/10'} hover:bg-cosmic-700/20`}
    >
      <TableCell className="font-medium border-b border-cosmic-700/20">
        <div>{formatTime(forecast.time)}</div>
        <div className="text-xs text-muted-foreground">{formatDate(forecast.time)}</div>
      </TableCell>
      <TableCell className="text-center border-b border-cosmic-700/20">
        <div className="flex items-center justify-center">
          <DynamicTemperatureIcon temperature={forecast.temperature} className="mr-1 h-4 w-4" />
          <span className={forecast.temperature > 25 ? 'text-amber-400' : forecast.temperature < 15 ? 'text-blue-400' : ''}>
            {isNaN(forecast.temperature) ? "--" : forecast.temperature.toFixed(1)}°C
          </span>
        </div>
      </TableCell>
      <TableCell className={`text-center border-b border-cosmic-700/20 ${weatherClass}`}>
        <div className="flex items-center justify-center">
          <DynamicCloudCoverIcon 
            cloudCover={forecast.cloudCover} 
            precipitation={forecast.precipitation} 
            className="mr-1 h-4 w-4" 
          />
          <span>{isNaN(forecast.cloudCover) ? "--" : forecast.cloudCover}%</span>
        </div>
      </TableCell>
      <TableCell className="text-center border-b border-cosmic-700/20">
        <div className="flex items-center justify-center">
          <DynamicWindIcon windSpeed={forecast.windSpeed} className="mr-1 h-4 w-4" />
          <span>{isNaN(forecast.windSpeed) ? "--" : forecast.windSpeed} {t("km/h", "公里/小时")}</span>
        </div>
      </TableCell>
      <TableCell className="text-center border-b border-cosmic-700/20">
        <div className="flex items-center justify-center">
          <DynamicHumidityIcon humidity={forecast.humidity} className="mr-1 h-4 w-4" />
          <span>{isNaN(forecast.humidity) ? "--" : forecast.humidity}%</span>
        </div>
      </TableCell>
      <TableCell className="border-b border-cosmic-700/20">
        <div className="flex items-center gap-2">
          <DynamicPrecipitationIcon precipitation={forecast.precipitation} weatherCode={forecast.weatherCode} />
          <span>{formatCondition(forecast.cloudCover, t)}</span>
        </div>
      </TableCell>
      <TableCell className="text-center border-b border-cosmic-700/20">
        <div className={`px-2 py-1 rounded-full text-xs font-medium ${siqs.color} bg-opacity-20 text-white inline-flex items-center justify-center min-w-[40px]`}>
          {siqs.score.toFixed(1)}
        </div>
      </TableCell>
    </TableRow>
  );
};

export default React.memo(ForecastTableRow);
