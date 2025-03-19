
import React from "react";
import { TableCell, TableRow } from "@/components/ui/table";
import { useLanguage } from "@/contexts/LanguageContext";
import { 
  DynamicCloudCoverIcon, 
  DynamicWindIcon, 
  DynamicHumidityIcon 
} from "@/components/weather/DynamicIcons";
import { formatDate, getSIQSRating } from "@/components/forecast/ForecastUtils";
import { motion } from "framer-motion";

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
  
  // Determine if it's nighttime based on isAstroHour property
  const isNighttime = forecast.isAstroHour === true;
  
  // Determine if the day is good for astronomy
  const isGoodForAstro = siqs.score >= 7.0;
  
  return (
    <motion.tr
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className={`transition-all duration-300 ${
        index % 2 === 0 ? 'bg-cosmic-700/5' : 'bg-cosmic-700/10'
      } hover:bg-cosmic-700/20 ${
        isNighttime ? 'border-l-2 border-indigo-500/50' : ''
      } ${
        isGoodForAstro ? 'border-r-2 border-green-500/50' : ''
      }`}
    >
      <TableCell className="font-medium border-b border-cosmic-700/20">
        {formatDate(forecast.date)}
      </TableCell>
      
      <TableCell className="text-center border-b border-cosmic-700/20">
        <div className="flex flex-col items-center">
          <motion.span 
            initial={{ scale: 0.9 }} 
            animate={{ scale: 1 }}
            className="text-amber-400"
          >
            {Math.round(forecast.temperature_max)}°
          </motion.span>
          <motion.span 
            initial={{ scale: 0.9 }} 
            animate={{ scale: 1 }}
            transition={{ delay: 0.1 }}
            className="text-blue-400 text-xs"
          >
            {Math.round(forecast.temperature_min)}°
          </motion.span>
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
        <motion.div 
          whileHover={{ scale: 1.1 }}
          className={`px-2 py-1 rounded-full text-xs font-medium ${siqs.color} bg-opacity-20 text-white inline-flex items-center justify-center min-w-[40px] animate-fade-in`}
        >
          {siqs.score.toFixed(1)}
        </motion.div>
      </TableCell>
    </motion.tr>
  );
};

export default React.memo(ForecastRow);
