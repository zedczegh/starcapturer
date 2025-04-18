
import React from "react";
import { TableCell, TableRow } from "@/components/ui/table";
import { useLanguage } from "@/contexts/LanguageContext";
import { formatDate, formatTime, getSIQSRating } from "./ForecastUtils";
import { DynamicCloudCoverIcon, DynamicWindIcon, DynamicHumidityIcon } from "@/components/weather/DynamicIcons";

interface ForecastProps {
  forecast: any;
  index: number;
  locationLatitude?: number;
  locationLongitude?: number;
}

const ForecastRow: React.FC<ForecastProps> = ({ forecast, index, locationLatitude, locationLongitude }) => {
  const { t } = useLanguage();
  const isNighttime = isNightHour(forecast.date);
  
  const siqs = getSIQSRating(
    forecast.cloudCover, 
    forecast.windSpeed, 
    forecast.humidity,
    t
  );
  
  // Determine row styling - using subtle night row styling
  const rowClass = `${index % 2 === 0 ? 'bg-cosmic-800/5' : 'bg-cosmic-800/10'} 
                 hover:bg-cosmic-800/20 ${isNighttime ? 'night-row' : ''}`;
  
  // Format the time to display using location's coordinates if available
  const displayTime = formatTime(forecast.date, locationLatitude, locationLongitude);
  
  return (
    <TableRow className={rowClass}>
      <TableCell className="border-b border-cosmic-700/20">
        <div className="flex items-center">
          {isNighttime && (
            <span 
              className="inline-block w-2 h-2 rounded-full bg-blue-400 mr-2 opacity-60" 
              title={t("Night hours (6PM-7AM)", "夜间时段 (18:00-07:00)")}
            />
          )}
          {displayTime}
        </div>
      </TableCell>
      <TableCell className="text-center border-b border-cosmic-700/20">
        {typeof forecast.temperature === 'number' ? `${forecast.temperature.toFixed(1)}°` : '--'}
      </TableCell>
      <TableCell className="text-center border-b border-cosmic-700/20">
        <div className="flex items-center justify-center">
          <DynamicCloudCoverIcon cloudCover={forecast.cloudCover} className="mr-1 h-4 w-4" />
          <span className={forecast.cloudCover > 40 ? 'text-red-400' : ''}>
            {forecast.cloudCover}%
          </span>
        </div>
      </TableCell>
      <TableCell className="text-center border-b border-cosmic-700/20">
        <div className="flex items-center justify-center">
          <DynamicWindIcon windSpeed={forecast.windSpeed} className="mr-1 h-4 w-4" />
          <span>{forecast.windSpeed} {t("km/h", "公里/小时")}</span>
        </div>
      </TableCell>
      <TableCell className="text-center border-b border-cosmic-700/20">
        <div className="flex items-center justify-center">
          <DynamicHumidityIcon humidity={forecast.humidity} className="mr-1 h-4 w-4" />
          <span>{forecast.humidity}%</span>
        </div>
      </TableCell>
      <TableCell className="text-center border-b border-cosmic-700/20">
        <div className={`px-2 py-1 rounded-full text-xs font-medium ${siqs.color} inline-flex items-center justify-center min-w-[40px]`}>
          {forecast.cloudCover >= 40 ? '0.0' : siqs.score.toFixed(1)}
        </div>
      </TableCell>
    </TableRow>
  );
};

// Helper function to check if this is a nighttime hour
function isNightHour(dateStr: string): boolean {
  const date = new Date(dateStr);
  const hour = date.getHours();
  // Night hours between 6 PM and 7 AM
  return hour >= 18 || hour < 7;
}

export default React.memo(ForecastRow);
