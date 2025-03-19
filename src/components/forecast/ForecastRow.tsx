
import React from "react";
import { TableCell, TableRow } from "@/components/ui/table";
import { useLanguage } from "@/contexts/LanguageContext";
import { 
  DynamicCloudCoverIcon, 
  DynamicWindIcon, 
  DynamicHumidityIcon 
} from "@/components/weather/DynamicIcons";
import { formatDate, getSIQSRating } from "@/components/forecast/ForecastUtils";

interface ForecastRowProps {
  forecast: any;
  index: number;
}

const ForecastRow: React.FC<ForecastRowProps> = ({ forecast, index }) => {
  const { t } = useLanguage();
  
  // Calculate SIQS rating based on forecast data
  const siqs = getSIQSRating(forecast.cloudCover, forecast.windSpeed, forecast.humidity, t);
  
  // Determine weather class for special effects
  const getWeatherClass = () => {
    const precipitation = forecast.precipitation || 0;
    const cloudCover = forecast.cloudCover || 0;
    
    if (precipitation > 0.5) return "animate-pulse bg-red-500/20";
    if (cloudCover < 20) return "animate-pulse bg-green-500/20";
    return "";
  };
  
  const weatherClass = getWeatherClass();
  
  return (
    <TableRow 
      className={`transition-colors ${index % 2 === 0 ? 'bg-cosmic-700/5' : 'bg-cosmic-700/10'} hover:bg-cosmic-700/20`}
    >
      <TableCell className="font-medium border-b border-cosmic-700/20">
        {formatDate(forecast.date)}
      </TableCell>
      
      <TableCell className="text-center border-b border-cosmic-700/20">
        <div className="flex flex-col items-center">
          <span className="text-amber-400">{Math.round(forecast.temperature_max)}°</span>
          <span className="text-blue-400 text-xs">{Math.round(forecast.temperature_min)}°</span>
        </div>
      </TableCell>
      
      <TableCell className={`text-center border-b border-cosmic-700/20 ${weatherClass}`}>
        <div className="flex items-center justify-center">
          <DynamicCloudCoverIcon 
            cloudCover={forecast.cloudCover} 
            precipitation={forecast.precipitation} 
            className="mr-1 h-4 w-4" 
          />
          <span>{Math.round(forecast.cloudCover)}%</span>
        </div>
      </TableCell>
      
      <TableCell className="text-center border-b border-cosmic-700/20">
        <div className="flex items-center justify-center">
          <DynamicWindIcon windSpeed={forecast.windSpeed} className="mr-1 h-4 w-4" />
          <span>{Math.round(forecast.windSpeed)} {t("km/h", "公里/小时")}</span>
        </div>
      </TableCell>
      
      <TableCell className="text-center border-b border-cosmic-700/20">
        <div className="flex items-center justify-center">
          <DynamicHumidityIcon humidity={forecast.humidity} className="mr-1 h-4 w-4" />
          <span>{Math.round(forecast.humidity)}%</span>
        </div>
      </TableCell>
      
      <TableCell className="text-center border-b border-cosmic-700/20">
        <div className={`px-2 py-1 rounded-full text-xs font-medium ${siqs.color} bg-opacity-20 text-white inline-flex items-center justify-center min-w-[40px] animate-fade-in`}>
          {siqs.score.toFixed(1)}
        </div>
      </TableCell>
    </TableRow>
  );
};

export default React.memo(ForecastRow);
