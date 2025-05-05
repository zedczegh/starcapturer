
import React, { memo } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { 
  Cloud, 
  Moon, 
  BadgeInfo,
  CloudSun
} from "lucide-react";
import ConditionItem from "./ConditionItem";
import { getBortleDescription } from "@/utils/weather/bortleScaleUtils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface SecondaryConditionsProps {
  cloudCover: number;
  moonPhase: string | number;
  bortleScale: number | null;
  aqi?: number;
  nighttimeCloudData?: {
    average: number;
    timeRange: string;
    description: string;
    evening?: number | null;
    morning?: number | null;
  } | null;
}

const SecondaryConditions = memo<SecondaryConditionsProps>(({
  cloudCover,
  moonPhase,
  bortleScale,
  aqi,
  nighttimeCloudData
}) => {
  const { t } = useLanguage();
  
  // Helper functions to get appropriate colors based on values
  const getCloudColor = (cover: number) => {
    if (cover <= 20) return "text-green-400";
    if (cover <= 40) return "text-lime-400";
    if (cover <= 70) return "text-yellow-400";
    return "text-red-400";
  };
  
  return (
    <div className="grid grid-cols-1 gap-3">
      <TooltipProvider>
        {/* Cloud Cover */}
        <div className="flex items-center justify-between p-2.5 rounded-lg bg-cosmic-800/40 border border-cosmic-700/50 hover:bg-cosmic-800/60 transition-colors">
          <div className="flex items-center">
            <div className="p-1.5 rounded-full bg-cosmic-700/40 mr-2">
              <Cloud className="h-4 w-4 text-cosmic-200" />
            </div>
            <span className="font-medium text-xs">{t("Cloud Cover", "云量")}</span>
          </div>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className={`font-bold text-sm ${getCloudColor(cloudCover)}`}>
                {Math.round(cloudCover)}%
              </span>
            </TooltipTrigger>
            <TooltipContent side="left" className="bg-cosmic-800 border-cosmic-700">
              <p className="text-xs">
                {cloudCover <= 20
                  ? t("Clear sky - excellent for astronomy", "晴朗 - 非常适合天文观测")
                  : cloudCover <= 40
                  ? t("Mostly clear - good conditions", "大部分晴朗 - 良好条件")
                  : cloudCover <= 70
                  ? t("Partly cloudy - fair conditions", "部分多云 - 一般条件")
                  : t("Mostly cloudy - poor conditions", "大部分多云 - 差条件")
                }
              </p>
            </TooltipContent>
          </Tooltip>
        </div>
        
        {/* Nighttime Cloud Cover */}
        {nighttimeCloudData && (
          <div className="flex items-center justify-between p-2.5 rounded-lg bg-cosmic-800/40 border border-cosmic-700/50 hover:bg-cosmic-800/60 transition-colors">
            <div className="flex items-center">
              <div className="p-1.5 rounded-full bg-cosmic-700/40 mr-2">
                <CloudSun className="h-4 w-4 text-cosmic-200" />
              </div>
              <span className="font-medium text-xs">{t("Tonight's Cloud Cover", "今晚云量")}</span>
            </div>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center">
                  <span className={`font-bold text-sm ${getCloudColor(nighttimeCloudData.average)}`}>
                    {Math.round(nighttimeCloudData.average)}%
                  </span>
                  {nighttimeCloudData.timeRange && (
                    <span className="ml-1.5 text-xs text-cosmic-400 bg-cosmic-700/30 px-1.5 py-0.5 rounded">
                      {nighttimeCloudData.timeRange}
                    </span>
                  )}
                </div>
              </TooltipTrigger>
              <TooltipContent side="left" className="bg-cosmic-800 border-cosmic-700">
                <p className="text-xs">{t("Predicted cloud cover during astronomical night", "天文夜间预测云量")}</p>
              </TooltipContent>
            </Tooltip>
          </div>
        )}
        
        {/* Moon Phase */}
        <div className="flex items-center justify-between p-2.5 rounded-lg bg-cosmic-800/40 border border-cosmic-700/50 hover:bg-cosmic-800/60 transition-colors">
          <div className="flex items-center">
            <div className="p-1.5 rounded-full bg-cosmic-700/40 mr-2">
              <Moon className="h-4 w-4 text-cosmic-200" />
            </div>
            <span className="font-medium text-xs">{t("Moon Phase", "月相")}</span>
          </div>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="font-bold text-sm text-cosmic-50">
                {moonPhase}
              </span>
            </TooltipTrigger>
            <TooltipContent side="left" className="bg-cosmic-800 border-cosmic-700">
              <p className="text-xs">
                {(() => {
                  if (typeof moonPhase === 'number') {
                    const phase = parseInt(moonPhase.toString(), 10);
                    if (phase <= 1 || phase >= 27) {
                      return t("New moon - excellent for deep sky observation", "新月 - 非常适合深空观测");
                    } else if (phase <= 6 || phase >= 22) {
                      return t("Crescent moon - good for astronomy", "娥眉月 - 较好的天文条件");
                    } else if (phase <= 9 || phase >= 19) {
                      return t("Quarter moon - fair conditions", "上/下弦月 - 一般条件");
                    } else {
                      return t("Full moon - difficult for deep sky objects", "满月 - 不适合深空天体观测");
                    }
                  } else {
                    // Handle named moon phases
                    const phaseLower = moonPhase.toString().toLowerCase();
                    if (phaseLower.includes("new")) {
                      return t("New moon - excellent for deep sky observation", "新月 - 非常适合深空观测");
                    } else if (phaseLower.includes("crescent")) {
                      return t("Crescent moon - good for astronomy", "娥眉月 - 较好的天文条件");
                    } else if (phaseLower.includes("quarter")) {
                      return t("Quarter moon - fair conditions", "上/下弦月 - 一般条件");
                    } else if (phaseLower.includes("gibbous")) {
                      return t("Gibbous moon - challenging for faint objects", "凸月 - 对暗淡天体有挑战");
                    } else if (phaseLower.includes("full")) {
                      return t("Full moon - difficult for deep sky objects", "满月 - 不适合深空天体观测");
                    } else {
                      return t("Current moon phase", "当前月相");
                    }
                  }
                })()}
              </p>
            </TooltipContent>
          </Tooltip>
        </div>
        
        {/* Bortle Scale */}
        {bortleScale && (
          <div className="flex items-center justify-between p-2.5 rounded-lg bg-cosmic-800/40 border border-cosmic-700/50 hover:bg-cosmic-800/60 transition-colors">
            <div className="flex items-center">
              <div className="p-1.5 rounded-full bg-cosmic-700/40 mr-2">
                <BadgeInfo className="h-4 w-4 text-cosmic-200" />
              </div>
              <span className="font-medium text-xs">{t("Bortle Scale", "波特尔等级")}</span>
            </div>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="font-bold text-sm text-cosmic-50">
                  {bortleScale}/9
                </span>
              </TooltipTrigger>
              <TooltipContent side="left" className="bg-cosmic-800 border-cosmic-700">
                <p className="text-xs">{getBortleDescription(bortleScale)}</p>
              </TooltipContent>
            </Tooltip>
          </div>
        )}
        
        {/* Air Quality */}
        {aqi !== undefined && (
          <div className="flex items-center justify-between p-2.5 rounded-lg bg-cosmic-800/40 border border-cosmic-700/50 hover:bg-cosmic-800/60 transition-colors">
            <div className="flex items-center">
              <div className="p-1.5 rounded-full bg-cosmic-700/40 mr-2">
                <BadgeInfo className="h-4 w-4 text-cosmic-200" />
              </div>
              <span className="font-medium text-xs">{t("Air Quality", "空气质量")}</span>
            </div>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="font-bold text-sm text-cosmic-50">
                  {aqi}
                </span>
              </TooltipTrigger>
              <TooltipContent side="left" className="bg-cosmic-800 border-cosmic-700">
                <p className="text-xs">{t("Air Quality Index", "空气质量指数")}</p>
              </TooltipContent>
            </Tooltip>
          </div>
        )}
      </TooltipProvider>
    </div>
  );
});

SecondaryConditions.displayName = 'SecondaryConditions';

export default SecondaryConditions;
