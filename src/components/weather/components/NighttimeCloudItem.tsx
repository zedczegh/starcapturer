
import React from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import DynamicCloudCoverIcon from "@/components/weather/icons/DynamicCloudCoverIcon";
import { getCloudCoverColorClass } from "./CloudCoverItem";

interface NighttimeCloudItemProps {
  nighttimeCloudData: {
    average: number;
    description?: string;
    timeRange?: string;
    evening?: number;
    morning?: number;
  };
}

const NighttimeCloudItem: React.FC<NighttimeCloudItemProps> = ({ nighttimeCloudData }) => {
  const { t } = useLanguage();
  
  // Format cloud cover data with proper values
  const cloudCoverValue = typeof nighttimeCloudData.average === 'number' ? 
    nighttimeCloudData.average : 0;
  
  // Ensure the value is a percentage (0-100)
  const normalizedCloudCover = Math.max(0, Math.min(100, cloudCoverValue));
  
  return (
    <div className="flex items-center justify-between p-3 rounded-lg bg-cosmic-800/40 border border-cosmic-700/50 hover:bg-cosmic-800/60 transition-colors">
      <div className="flex items-center">
        <div className="p-2 rounded-full bg-cosmic-700/40 mr-3">
          <DynamicCloudCoverIcon cloudCover={normalizedCloudCover} className="h-5 w-5 text-cosmic-200" />
        </div>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="font-medium flex items-center">
              {t("Astro Night Cloud Cover", "天文夜云量")}
              <Info className="h-3.5 w-3.5 ml-1 text-cosmic-400 inline-block" />
            </span>
          </TooltipTrigger>
          <TooltipContent side="left" className="max-w-xs bg-cosmic-800 border-cosmic-600">
            <p className="text-xs text-cosmic-100">
              {nighttimeCloudData.timeRange ? (
                t(
                  `Average cloud cover during astronomical night (${nighttimeCloudData.timeRange}) based on forecast data.`, 
                  `基于预报数据的天文夜 (${nighttimeCloudData.timeRange}) 平均云量。`
                )
              ) : (
                t(
                  "Average cloud cover during tonight's astronomical night based on forecast data.", 
                  "基于预报数据的今晚天文夜平均云量。"
                )
              )}
            </p>
          </TooltipContent>
        </Tooltip>
      </div>
      <span className={`font-bold text-lg ${getCloudCoverColorClass(normalizedCloudCover)}`}>
        {normalizedCloudCover.toFixed(1)}%
      </span>
    </div>
  );
};

export default NighttimeCloudItem;
