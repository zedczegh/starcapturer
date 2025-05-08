
import React from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Card } from "@/components/ui/card";
import { Cloud, Moon, Star, AlertTriangle } from "lucide-react";
import CloudCoverItem from "./components/CloudCoverItem";
import NighttimeCloudItem from "./components/NighttimeCloudItem";
import MoonPhaseItem from "./components/MoonPhaseItem";
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
    <Card className="p-4 bg-cosmic-900/50 border-cosmic-800 hover:bg-cosmic-800/50 transition-all duration-300">
      <div className="space-y-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-3">
            <div className="bg-cosmic-800/50 p-2 rounded-full">
              <Cloud className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h3 className="text-sm font-medium">
                {t('Sky Conditions', '天空状况')}
              </h3>
            </div>
          </div>
        </div>

        <TooltipProvider>
          <div className="space-y-3">
            {/* Cloud Cover */}
            <div className="space-y-1 border-b border-cosmic-700/30 pb-2">
              <CloudCoverItem cloudCover={cloudCover} />
            </div>
            
            {/* Nighttime Cloud Data */}
            {nighttimeCloudData && (
              <div className="space-y-1 border-b border-cosmic-700/30 pb-2">
                <NighttimeCloudItem nighttimeCloudData={nighttimeCloudData} />
              </div>
            )}
            
            {/* Moon Phase */}
            <div className="space-y-1 border-b border-cosmic-700/30 pb-2">
              <MoonPhaseItem moonPhase={moonPhase} language={language as 'en' | 'zh'} />
            </div>
            
            {/* Bortle Scale */}
            <div className="space-y-1 border-b border-cosmic-700/30 pb-2">
              <BortleScaleItem bortleScale={bortleScale} />
            </div>
            
            {/* Air Quality */}
            {aqi !== undefined && (
              <div className="space-y-1">
                <AirQualityItem aqi={aqi} />
              </div>
            )}
            
            {/* If no data available */}
            {!cloudCover && !bortleScale && !moonPhase && (
              <div className="flex flex-col items-center justify-center py-6">
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
