
import React from "react";
import { TableCell, TableRow } from "@/components/ui/table";
import { Sun, MoonStar } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { 
  DynamicCloudCoverIcon, 
  DynamicWindIcon, 
  DynamicHumidityIcon 
} from "@/components/weather/DynamicIcons";
import { formatDate, getSIQSRating } from "./ForecastUtils";

interface ForecastRowProps {
  forecast: any;
  index: number;
}

const ForecastRow: React.FC<ForecastRowProps> = ({ forecast, index }) => {
  const { t } = useLanguage();
  const siqsRating = getSIQSRating(forecast.cloudCover, forecast.windSpeed, forecast.humidity, t);
  
  return (
    <TableRow 
      className={`transition-colors ${index === 0 ? 'bg-primary/5' : index % 2 === 0 ? 'bg-cosmic-700/5' : 'bg-cosmic-700/10'} hover:bg-cosmic-700/20`}
    >
      <TableCell className="font-medium border-b border-cosmic-700/20">
        <div className="flex items-center gap-2">
          {index === 0 && (
            <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">
              {t("Today", "今天")}
            </span>
          )}
          {formatDate(forecast.date)}
        </div>
      </TableCell>
      <TableCell className="text-center border-b border-cosmic-700/20">
        <div className="flex flex-col">
          <span className="text-amber-400 flex items-center justify-center">
            <Sun className="h-3 w-3 mr-1" />
            {isNaN(forecast.temperature_max) ? "--" : forecast.temperature_max.toFixed(1)}°
          </span>
          <span className="text-blue-400 flex items-center justify-center">
            <MoonStar className="h-3 w-3 mr-1" />
            {isNaN(forecast.temperature_min) ? "--" : forecast.temperature_min.toFixed(1)}°
          </span>
        </div>
      </TableCell>
      <TableCell className="text-center border-b border-cosmic-700/20">
        <div className="flex items-center justify-center">
          <DynamicCloudCoverIcon cloudCover={forecast.cloudCover} className="mr-1 h-4 w-4" />
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
          <div className="flex-1 h-2 w-full rounded-full bg-cosmic-700/20">
            <div 
              className={`h-2 rounded-full ${siqsRating.color}`} 
              style={{ width: `${siqsRating.score * 10}%`, transition: 'width 0.3s ease-in-out' }}
            ></div>
          </div>
          <span className="text-sm whitespace-nowrap">{siqsRating.quality}</span>
        </div>
      </TableCell>
    </TableRow>
  );
};

export default React.memo(ForecastRow);
