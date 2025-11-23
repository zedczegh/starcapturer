
import React from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Card } from "@/components/ui/card";
import { Cloud, AlertTriangle } from "lucide-react";
import CloudCoverItem from "./components/CloudCoverItem";
import NighttimeCloudItem from "./components/NighttimeCloudItem";
import BortleScaleItem from "./components/BortleScaleItem";
import AirQualityItem from "./components/AirQualityItem";

interface SecondaryConditionsProps {
  cloudCover: number;
  moonPhase: string;
  bortleScale: number | null;
  aqi?: number;
  nighttimeCloudData?: {
    average: number;
    description?: string;
    timeRange?: string;
    evening?: number;
    morning?: number;
  } | null;
}

const SecondaryConditions: React.FC<SecondaryConditionsProps> = ({
  cloudCover,
  moonPhase,
  bortleScale,
  aqi,
  nighttimeCloudData
}) => {
  const { language, t } = useLanguage();
  
  return (
    <Card className="bg-cosmic-900/50 border-cosmic-800 hover:bg-cosmic-800/50 transition-all duration-300">
      <div className="p-3 sm:p-4 md:p-5">
        <div className="flex items-center justify-between mb-2 sm:mb-4">
          <div className="flex items-center gap-2">
            <div className="bg-cosmic-800/50 p-1.5 sm:p-2 rounded-full">
              <Cloud className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400" />
            </div>
            <h3 className="text-sm font-medium">
              {t('Sky Conditions', '天空状况')}
            </h3>
          </div>
        </div>

        <TooltipProvider>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-4">
            {/* Cloud Cover */}
            <div className="bg-cosmic-800/30 rounded-lg p-2 sm:p-3">
              <CloudCoverItem cloudCover={cloudCover} />
            </div>
            
            {/* Nighttime Cloud Data */}
            {nighttimeCloudData && (
              <div className="bg-cosmic-800/30 rounded-lg p-2 sm:p-3">
                <NighttimeCloudItem nighttimeCloudData={nighttimeCloudData} />
              </div>
            )}
            
            {/* Bortle Scale */}
            <div className="bg-cosmic-800/30 rounded-lg p-2 sm:p-3">
              <BortleScaleItem bortleScale={bortleScale} />
            </div>
            
            {/* Air Quality */}
            {aqi !== undefined && (
              <div className="bg-cosmic-800/30 rounded-lg p-2 sm:p-3">
                <AirQualityItem aqi={aqi} />
              </div>
            )}
            
            {/* If no data available */}
            {!cloudCover && !bortleScale && (
              <div className="col-span-full flex flex-col items-center justify-center py-6">
                <AlertTriangle className="w-10 h-10 text-yellow-500 mb-2" />
                <p className="text-xs text-cosmic-400">
                  {t('No sky condition data available', '无天空状况数据')}
                </p>
              </div>
            )}
          </div>
        </TooltipProvider>
      </div>
    </Card>
  );
};

export default React.memo(SecondaryConditions);
