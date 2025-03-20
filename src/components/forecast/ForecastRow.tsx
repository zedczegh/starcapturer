
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
  
  // Save SIQS to the forecast object for later averaging
  forecast.siqs = {
    score: siqs.score,
    color: siqs.color
  };
  
  // Determine weather class for special effects
  const getWeatherClass = () => {
    const precipitation = forecast.precipitation || 0;
    const cloudCover = forecast.cloudCover || 0;
    
    if (precipitation > 0.5) return "animate-pulse bg-red-500/20";
    if (cloudCover < 20) return "bg-green-500/20 animate-fade-in";
    return "";
  };
  
  // Enhanced animation for night hours to highlight astronomical viewing times
  const isNightHour = () => {
    if (!forecast.date) return false;
    const hour = new Date(forecast.date).getHours();
    return hour >= 18 || hour < 7; // 6 PM to 7 AM
  };
  
  const nightClass = isNightHour() ? "night-row" : "";
  const weatherClass = getWeatherClass();
  
  return (
    <TableRow 
      className={`transition-all duration-300 ${index % 2 === 0 ? 'bg-cosmic-700/5' : 'bg-cosmic-700/10'} 
                hover:bg-cosmic-700/20 ${nightClass}`}
      style={{
        animationDelay: `${index * 50}ms`,
        transform: `translateY(${index * 2}px)`,
        opacity: 0,
        animation: `fadeSlideIn 500ms ${index * 50}ms forwards`
      }}
    >
      <TableCell className="font-medium border-b border-cosmic-700/20">
        {formatDate(forecast.date)}
      </TableCell>
      
      <TableCell className="text-center border-b border-cosmic-700/20">
        <div className="flex flex-col items-center">
          <span className="text-amber-400 transition-all hover:scale-110">{Math.round(forecast.temperature_max)}°</span>
          <span className="text-blue-400 text-xs transition-all hover:scale-110">{Math.round(forecast.temperature_min)}°</span>
        </div>
      </TableCell>
      
      <TableCell className={`text-center border-b border-cosmic-700/20 ${weatherClass} transition-all duration-300`}>
        <div className="flex items-center justify-center">
          <DynamicCloudCoverIcon 
            cloudCover={forecast.cloudCover} 
            precipitation={forecast.precipitation} 
            className="mr-1 h-4 w-4 transition-all duration-300 hover:scale-125" 
          />
          <span>{Math.round(forecast.cloudCover)}%</span>
        </div>
      </TableCell>
      
      <TableCell className="text-center border-b border-cosmic-700/20 transition-all duration-300">
        <div className="flex items-center justify-center">
          <DynamicWindIcon windSpeed={forecast.windSpeed} className="mr-1 h-4 w-4 transition-all hover:rotate-[20deg]" />
          <span>{Math.round(forecast.windSpeed)} {t("km/h", "公里/小时")}</span>
        </div>
      </TableCell>
      
      <TableCell className="text-center border-b border-cosmic-700/20 transition-all duration-300">
        <div className="flex items-center justify-center">
          <DynamicHumidityIcon humidity={forecast.humidity} className="mr-1 h-4 w-4 transition-all hover:scale-110" />
          <span>{Math.round(forecast.humidity)}%</span>
        </div>
      </TableCell>
      
      <TableCell className="text-center border-b border-cosmic-700/20 transition-all duration-300">
        <div className={`px-2 py-1 rounded-full text-xs font-medium ${siqs.color} bg-opacity-20 text-white 
                      inline-flex items-center justify-center min-w-[40px] animate-fade-in
                      hover:bg-opacity-40 transition-all hover:scale-110`}>
          {siqs.score.toFixed(1)}
        </div>
      </TableCell>
    </TableRow>
  );
};

export default React.memo(ForecastRow);
