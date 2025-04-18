
import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Thermometer, Droplets, Wind } from 'lucide-react';
import { getLocationDateTime } from '@/utils/timeZoneUtils';

interface PrimaryConditionsProps {
  temperature: number;
  humidity: number;
  windSpeed: number;
  seeingConditions: string;
  latitude?: number;
  longitude?: number;
}

const PrimaryConditions: React.FC<PrimaryConditionsProps> = ({
  temperature,
  humidity,
  windSpeed,
  seeingConditions,
  latitude,
  longitude
}) => {
  const { t } = useLanguage();
  
  // Get local time if coordinates are provided
  const localTime = React.useMemo(() => {
    if (latitude && longitude) {
      try {
        return getLocationDateTime(latitude, longitude, 'HH:mm');
      } catch (e) {
        console.error("Error getting location time:", e);
      }
    }
    return null;
  }, [latitude, longitude]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="flex items-center">
          <Thermometer className="h-5 w-5 mr-2 text-red-400" />
          <div>
            <div className="text-sm font-medium text-cosmic-300">
              {t("Temperature", "温度")}
            </div>
            <div className="font-medium text-cosmic-50">
              {temperature.toFixed(1)}°C
            </div>
          </div>
        </div>
        
        <div className="flex items-center">
          <Droplets className="h-5 w-5 mr-2 text-blue-400" />
          <div>
            <div className="text-sm font-medium text-cosmic-300">
              {t("Humidity", "湿度")}
            </div>
            <div className="font-medium text-cosmic-50">
              {humidity.toFixed(0)}%
            </div>
          </div>
        </div>
        
        <div className="flex items-center">
          <Wind className="h-5 w-5 mr-2 text-teal-400" />
          <div>
            <div className="text-sm font-medium text-cosmic-300">
              {t("Wind Speed", "风速")}
            </div>
            <div className="font-medium text-cosmic-50">
              {windSpeed.toFixed(1)} {t("km/h", "公里/小时")}
            </div>
          </div>
        </div>
        
        <div className="flex items-center">
          <svg className="h-5 w-5 mr-2 text-purple-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 6v6l4 2" />
          </svg>
          <div>
            <div className="text-sm font-medium text-cosmic-300">
              {t("Seeing Conditions", "视宁度")}
            </div>
            <div className="font-medium text-cosmic-50">
              {seeingConditions}
            </div>
          </div>
        </div>
      </div>
      
      {localTime && (
        <div className="flex items-center pt-2 border-t border-cosmic-700/30">
          <svg className="h-4 w-4 mr-2 text-cosmic-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
          <div>
            <div className="text-sm font-medium text-cosmic-300">
              {t("Local Time", "当地时间")}
            </div>
            <div className="font-medium text-cosmic-50">
              {localTime}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PrimaryConditions;
