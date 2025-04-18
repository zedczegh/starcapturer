
import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { CloudSun, Moon, GaugeCircle } from 'lucide-react';
import LightPollutionIndicator from '@/components/location/LightPollutionIndicator';

interface SecondaryConditionsProps {
  cloudCover: number;
  moonPhase: string;
  bortleScale: number | null;
  aqi?: number;
  nighttimeCloudData?: {
    average: number;
    timeRange: string;
    description?: string;
  } | null;
  latitude?: number;
  longitude?: number;
}

const SecondaryConditions: React.FC<SecondaryConditionsProps> = ({
  cloudCover,
  moonPhase,
  bortleScale,
  aqi,
  nighttimeCloudData,
  latitude,
  longitude
}) => {
  const { t } = useLanguage();
  
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="flex items-center">
          <CloudSun className="h-5 w-5 mr-2 text-blue-300" />
          <div>
            <div className="text-sm font-medium text-cosmic-300">
              {t("Cloud Cover", "云量")}
            </div>
            <div className="font-medium text-cosmic-50">
              {cloudCover.toFixed(0)}%
            </div>
          </div>
        </div>
        
        <div className="flex items-center">
          <Moon className="h-5 w-5 mr-2 text-yellow-200" />
          <div>
            <div className="text-sm font-medium text-cosmic-300">
              {t("Moon Phase", "月相")}
            </div>
            <div className="font-medium text-cosmic-50">
              {moonPhase}
            </div>
          </div>
        </div>
        
        <div className="flex items-center">
          <div className="mr-2">
            <LightPollutionIndicator 
              bortleScale={bortleScale || 4} 
              size="sm" 
              showDescription={false} 
            />
          </div>
          <div>
            <div className="text-sm font-medium text-cosmic-300">
              {t("Bortle Scale", "波尔特等级")}
            </div>
            <div className="font-medium text-cosmic-50">
              {bortleScale || '-'}
            </div>
          </div>
        </div>
        
        {typeof aqi === 'number' && (
          <div className="flex items-center">
            <GaugeCircle className="h-5 w-5 mr-2 text-green-400" />
            <div>
              <div className="text-sm font-medium text-cosmic-300">
                {t("Air Quality", "空气质量")}
              </div>
              <div className="font-medium text-cosmic-50">
                {t("AQI", "空气质量指数")}: {aqi}
              </div>
            </div>
          </div>
        )}
      </div>
      
      {nighttimeCloudData && (
        <div className="pt-2 border-t border-cosmic-700/30">
          <div className="flex items-center">
            <svg className="h-5 w-5 mr-2 text-indigo-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 18a5 5 0 0 0-10 0" />
              <line x1="12" y1="2" x2="12" y2="9" />
              <line x1="4.22" y1="10.22" x2="5.64" y2="11.64" />
              <line x1="1" y1="18" x2="3" y2="18" />
              <line x1="21" y1="18" x2="23" y2="18" />
              <line x1="18.36" y1="11.64" x2="19.78" y2="10.22" />
              <line x1="23" y1="22" x2="1" y2="22" />
              <polyline points="8 6 12 2 16 6" />
            </svg>
            <div>
              <div className="text-sm font-medium text-cosmic-300">
                {nighttimeCloudData.description || t("Nighttime Cloud Cover", "夜间云量")}
              </div>
              <div className="font-medium text-cosmic-50">
                {nighttimeCloudData.average.toFixed(0)}% 
                <span className="text-xs text-cosmic-400 ml-1">({nighttimeCloudData.timeRange})</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SecondaryConditions;
