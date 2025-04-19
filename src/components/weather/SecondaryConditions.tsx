
import React from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { TooltipProvider } from "@/components/ui/tooltip";
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
  const { language } = useLanguage();
  
  return (
    <div className="grid grid-cols-1 gap-4 text-cosmic-100">
      <TooltipProvider>
        <CloudCoverItem cloudCover={cloudCover} />
        
        {nighttimeCloudData && (
          <NighttimeCloudItem nighttimeCloudData={nighttimeCloudData} />
        )}
        
        <MoonPhaseItem moonPhase={moonPhase} language={language as 'en' | 'zh'} />
        
        <BortleScaleItem bortleScale={bortleScale} />
        
        {aqi !== undefined && (
          <AirQualityItem aqi={aqi} />
        )}
      </TooltipProvider>
    </div>
  );
};

export default SecondaryConditions;
