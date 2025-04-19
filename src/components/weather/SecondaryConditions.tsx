
import React from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Sun, Moon, Info, CloudFog } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { getBortleDescription } from "@/utils/weather/bortleScaleUtils";
import { DynamicCloudCoverIcon } from "@/components/weather/DynamicIcons";

const MOON_PHASE_TRANSLATIONS = {
  'en': {
    'New Moon': 'New Moon',
    'Waxing Crescent': 'Waxing Crescent',
    'First Quarter': 'First Quarter',
    'Waxing Gibbous': 'Waxing Gibbous',
    'Full Moon': 'Full Moon',
    'Waning Gibbous': 'Waning Gibbous',
    'Last Quarter': 'Last Quarter',
    'Waning Crescent': 'Waning Crescent'
  },
  'zh': {
    'New Moon': '新月',
    'Waxing Crescent': '娥眉月',
    'First Quarter': '上弦月',
    'Waxing Gibbous': '盈凸月',
    'Full Moon': '满月',
    'Waning Gibbous': '亏凸月',
    'Last Quarter': '下弦月',
    'Waning Crescent': '残月'
  }
};

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
  const { t, language } = useLanguage();
  
  // Translate moon phase based on current language
  const translatedMoonPhase = MOON_PHASE_TRANSLATIONS[language][moonPhase] || moonPhase;

  // Helper to get cloud cover color class based on value
  const getCloudCoverColorClass = (value: number) => {
    if (value <= 10) return "text-green-400";
    if (value <= 20) return "text-green-300";
    if (value <= 30) return "text-yellow-300";
    if (value <= 50) return "text-yellow-500";
    if (value <= 70) return "text-orange-400";
    return "text-red-400";
  };
  
  // Helper to get AQI color class and label
  const getAqiInfo = (value: number) => {
    if (value <= 20) return { color: "text-green-400", label: t("Excellent", "极佳") };
    if (value <= 40) return { color: "text-green-300", label: t("Good", "良好") };
    if (value <= 60) return { color: "text-yellow-300", label: t("Moderate", "中等") };
    if (value <= 80) return { color: "text-yellow-500", label: t("Fair", "一般") };
    if (value <= 100) return { color: "text-orange-400", label: t("Poor", "较差") };
    return { color: "text-red-400", label: t("Unhealthy", "不健康") };
  };
  
  return (
    <div className="grid grid-cols-1 gap-4 text-cosmic-100">
      <TooltipProvider>
        {/* Current Cloud Cover */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-cosmic-800/40 border border-cosmic-700/50 hover:bg-cosmic-800/60 transition-colors">
          <div className="flex items-center">
            <div className="p-2 rounded-full bg-cosmic-700/40 mr-3">
              <DynamicCloudCoverIcon cloudCover={cloudCover} className="h-5 w-5 text-cosmic-200" />
            </div>
            <span className="font-medium">{t("Current Cloud Cover", "当前云层覆盖")}</span>
          </div>
          <span className={`font-bold text-lg ${getCloudCoverColorClass(cloudCover)}`}>
            {cloudCover}%
          </span>
        </div>

        {/* Astronomical Night Cloud Cover */}
        {nighttimeCloudData && (
          <div className="flex items-center justify-between p-3 rounded-lg bg-cosmic-800/40 border border-cosmic-700/50 hover:bg-cosmic-800/60 transition-colors">
            <div className="flex items-center">
              <div className="p-2 rounded-full bg-cosmic-700/40 mr-3">
                <DynamicCloudCoverIcon cloudCover={nighttimeCloudData.average} className="h-5 w-5 text-cosmic-200" />
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
            <span className={`font-bold text-lg ${getCloudCoverColorClass(nighttimeCloudData.average)}`}>
              {nighttimeCloudData.average.toFixed(1)}%
            </span>
          </div>
        )}
        
        {/* Moon Phase */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-cosmic-800/40 border border-cosmic-700/50 hover:bg-cosmic-800/60 transition-colors">
          <div className="flex items-center">
            <div className="p-2 rounded-full bg-cosmic-700/40 mr-3">
              <Moon className="h-5 w-5 text-cosmic-200" />
            </div>
            <span className="font-medium">{t("Moon Phase", "月相")}</span>
          </div>
          <span className="font-bold text-lg text-cosmic-50">
            {translatedMoonPhase}
          </span>
        </div>
        
        {/* Bortle Scale */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-cosmic-800/40 border border-cosmic-700/50 hover:bg-cosmic-800/60 transition-colors">
          <div className="flex items-center">
            <div className="p-2 rounded-full bg-cosmic-700/40 mr-3">
              <Sun className="h-5 w-5 text-cosmic-200" />
            </div>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="font-medium flex items-center">
                  {t("Bortle Scale", "波尔特等级")}
                  <Info className="h-3.5 w-3.5 ml-1 text-cosmic-400 inline-block" />
                </span>
              </TooltipTrigger>
              <TooltipContent side="left" className="max-w-xs bg-cosmic-800 border-cosmic-600">
                <p className="text-xs text-cosmic-100">
                  {getBortleDescription(bortleScale || 5, t)}
                </p>
              </TooltipContent>
            </Tooltip>
          </div>
          <span className="font-bold text-lg text-cosmic-50">
            {bortleScale || "-"}
          </span>
        </div>
        
        {/* Air Quality */}
        {aqi !== undefined && (
          <div className="flex items-center justify-between p-3 rounded-lg bg-cosmic-800/40 border border-cosmic-700/50 hover:bg-cosmic-800/60 transition-colors">
            <div className="flex items-center">
              <div className="p-2 rounded-full bg-cosmic-700/40 mr-3">
                <CloudFog className="h-5 w-5 text-cosmic-200" />
              </div>
              <span className="font-medium">{t("Air Quality", "空气质量")}</span>
            </div>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className={`font-bold text-lg ${getAqiInfo(aqi).color}`}>
                  {aqi} ({getAqiInfo(aqi).label})
                </span>
              </TooltipTrigger>
              <TooltipContent side="left" className="max-w-xs bg-cosmic-800 border-cosmic-600">
                <p className="text-xs text-cosmic-100">
                  {t(
                    "European Air Quality Index (1-100+). Lower is better.", 
                    "欧洲空气质量指数 (1-100+)。越低越好。"
                  )}
                </p>
              </TooltipContent>
            </Tooltip>
          </div>
        )}
      </TooltipProvider>
    </div>
  );
};

export default SecondaryConditions;
