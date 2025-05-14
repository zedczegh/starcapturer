
import React from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Info, CloudMoon } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { getCloudCoverColorClass } from "./CloudCoverItem";

interface NighttimeCloudItemProps {
  nighttimeCloudData: {
    average: number | null;
    description?: string;
    timeRange?: string;
    evening?: number | null;
    morning?: number | null;
  };
}

const NighttimeCloudItem: React.FC<NighttimeCloudItemProps> = ({ nighttimeCloudData }) => {
  const { t } = useLanguage();
  
  // Format cloud cover data with proper values
  const cloudCoverValue = typeof nighttimeCloudData.average === 'number' ? 
    nighttimeCloudData.average : null;
  
  // Handle display when no data is available
  if (cloudCoverValue === null) {
    return (
      <div>
        <div className="flex items-center gap-2 mb-2">
          <CloudMoon className="w-4 h-4 text-blue-400" />
          <div className="flex items-center">
            <span className="text-sm font-medium">{t("Astro Night Cloud Cover", "天文夜云量")}</span>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-3.5 w-3.5 ml-1 text-cosmic-400 cursor-help" />
              </TooltipTrigger>
              <TooltipContent className="bg-cosmic-800 border-cosmic-700">
                <p className="text-xs">
                  {t(
                    "No astronomical night cloud cover data available for this location at this time.",
                    "目前没有该位置的天文夜云量数据。"
                  )}
                </p>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>
        
        <div className="bg-cosmic-800/50 rounded-md p-2 mt-1">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">{t('Coverage', '覆盖率')}</span>
            <span className="text-right text-base font-medium text-cosmic-400">
              {t("N/A", "暂无")}
            </span>
          </div>
        </div>
      </div>
    );
  }
  
  // Ensure the value is a percentage (0-100)
  const normalizedCloudCover = Math.max(0, Math.min(100, cloudCoverValue));
  
  // Evening and morning data for detailed display
  const hasDetailedData = nighttimeCloudData.evening !== null || nighttimeCloudData.morning !== null;
  
  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <CloudMoon className="w-4 h-4 text-blue-400" />
        <div className="flex items-center">
          <span className="text-sm font-medium">{t("Astro Night Cloud Cover", "天文夜云量")}</span>
          <Tooltip>
            <TooltipTrigger asChild>
              <Info className="h-3.5 w-3.5 ml-1 text-cosmic-400 cursor-help" />
            </TooltipTrigger>
            <TooltipContent className="bg-cosmic-800 border-cosmic-700">
              <p className="text-xs">
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
      </div>
      
      <div className="bg-cosmic-800/50 rounded-md p-2 mt-1">
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">{t('Coverage', '覆盖率')}</span>
          <span className={`text-right text-base font-medium ${getCloudCoverColorClass(normalizedCloudCover)}`}>
            {normalizedCloudCover.toFixed(1)}%
          </span>
        </div>
        
        {hasDetailedData && (
          <div className="mt-1">
            {typeof nighttimeCloudData.evening === 'number' && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">{t('Evening', '晚上')}</span>
                <span className="text-right text-xs text-cosmic-300">
                  {nighttimeCloudData.evening.toFixed(1)}%
                </span>
              </div>
            )}
            
            {typeof nighttimeCloudData.morning === 'number' && (
              <div className="flex justify-between items-center mt-1">
                <span className="text-sm text-muted-foreground">{t('Morning', '早上')}</span>
                <span className="text-right text-xs text-cosmic-300">
                  {nighttimeCloudData.morning.toFixed(1)}%
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default NighttimeCloudItem;
