
import React, { useCallback } from "react";
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
  
  // Save SIQS to the forecast object for later averaging
  forecast.siqs = {
    score: siqs.score,
    color: siqs.color
  };
  
  // Determine weather class for special effects
  const getWeatherClass = useCallback(() => {
    const precipitation = forecast.precipitation || 0;
    const cloudCover = forecast.cloudCover || 0;
    
    if (precipitation > 0.5) return "animate-pulse bg-red-500/20";
    if (cloudCover < 20) return "bg-green-500/20 animate-fade-in";
    return "";
  }, [forecast.precipitation, forecast.cloudCover]);
  
  // Enhanced animation for night hours to highlight astronomical viewing times
  const isNightHour = useCallback(() => {
    if (!forecast.date) return false;
    const hour = new Date(forecast.date).getHours();
    return hour >= 18 || hour < 7; // 6 PM to 7 AM
  }, [forecast.date]);
  
  const nightClass = isNightHour() ? "night-row" : "";
  const weatherClass = getWeatherClass();
  
  // Determine if this is the most optimal viewing time
  const isOptimalViewing = forecast.siqs.score > 7;
  
  return (
    <motion.tr 
      className={`transition-all duration-300 ${index % 2 === 0 ? 'bg-cosmic-700/5' : 'bg-cosmic-700/10'} 
                hover:bg-cosmic-700/20 ${nightClass} ${isOptimalViewing ? 'border-l-2 border-green-500' : ''}`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        duration: 0.3, 
        delay: index * 0.05, 
        ease: "easeOut" 
      }}
      whileHover={{ 
        backgroundColor: isNightHour() ? "rgba(139, 92, 246, 0.2)" : "rgba(55, 65, 81, 0.2)",
        scale: isOptimalViewing ? 1.02 : 1.01,
        transition: { duration: 0.2 }
      }}
    >
      <TableCell className="font-medium border-b border-cosmic-700/20">
        {formatDate(forecast.date)}
      </TableCell>
      
      <TableCell className="text-center border-b border-cosmic-700/20">
        <div className="flex flex-col items-center">
          <motion.span 
            className="text-amber-400" 
            whileHover={{ scale: 1.2 }}
            transition={{ type: "spring", stiffness: 400, damping: 10 }}
          >
            {Math.round(forecast.temperature_max)}°
          </motion.span>
          <motion.span 
            className="text-blue-400 text-xs" 
            whileHover={{ scale: 1.2 }}
            transition={{ type: "spring", stiffness: 400, damping: 10 }}
          >
            {Math.round(forecast.temperature_min)}°
          </motion.span>
        </div>
      </TableCell>
      
      <TableCell className={`text-center border-b border-cosmic-700/20 ${weatherClass} transition-all duration-300`}>
        <motion.div 
          className="flex items-center justify-center"
          whileHover={{ scale: 1.1 }}
        >
          <DynamicCloudCoverIcon 
            cloudCover={forecast.cloudCover} 
            precipitation={forecast.precipitation} 
            className="mr-1 h-4 w-4 transition-all duration-300" 
          />
          <span>{Math.round(forecast.cloudCover)}%</span>
        </motion.div>
      </TableCell>
      
      <TableCell className="text-center border-b border-cosmic-700/20 transition-all duration-300">
        <motion.div 
          className="flex items-center justify-center"
          whileHover={{ 
            scale: 1.1,
            rotate: forecast.windSpeed > 15 ? 10 : 0 
          }}
        >
          <DynamicWindIcon windSpeed={forecast.windSpeed} className="mr-1 h-4 w-4" />
          <span>{Math.round(forecast.windSpeed)} {t("km/h", "公里/小时")}</span>
        </motion.div>
      </TableCell>
      
      <TableCell className="text-center border-b border-cosmic-700/20 transition-all duration-300">
        <motion.div 
          className="flex items-center justify-center"
          whileHover={{ scale: 1.1 }}
        >
          <DynamicHumidityIcon humidity={forecast.humidity} className="mr-1 h-4 w-4" />
          <span>{Math.round(forecast.humidity)}%</span>
        </motion.div>
      </TableCell>
      
      <TableCell className="text-center border-b border-cosmic-700/20 transition-all duration-300">
        <motion.div 
          className={`px-2 py-1 rounded-full text-xs font-medium ${siqs.color} bg-opacity-20 text-white 
                    inline-flex items-center justify-center min-w-[40px]
                    hover:bg-opacity-40 transition-all`}
          whileHover={{ scale: 1.15 }}
          animate={isOptimalViewing ? { 
            scale: [1, 1.1, 1],
            opacity: [1, 0.8, 1]
          } : {}}
          transition={isOptimalViewing ? { 
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          } : {}}
        >
          {siqs.score.toFixed(1)}
        </motion.div>
      </TableCell>
    </motion.tr>
  );
};

export default React.memo(ForecastRow);
