
import React from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { CloudSun, CloudMoon, Sun } from "lucide-react";

interface NighttimeCloudInfoProps {
  nighttimeCloudData: {
    average: number | null;
    evening: number | null;
    morning: number | null;
  } | null;
}

const NighttimeCloudInfo: React.FC<NighttimeCloudInfoProps> = ({ nighttimeCloudData }) => {
  const { t } = useLanguage();
  
  if (!nighttimeCloudData || nighttimeCloudData.average === null) {
    return null;
  }
  
  // Calculate cloud coverage class with improved color scheme
  const getCloudClass = (value: number | null) => {
    if (value === null) return "";
    if (value < 10) return "text-green-500";
    if (value < 30) return "text-blue-400";
    if (value < 60) return "text-yellow-400";
    return "text-red-400";
  };
  
  // Get qualifying text based on cloud percentage
  const getCloudQualityText = (value: number | null) => {
    if (value === null) return "";
    if (value < 10) return t("Excellent", "极佳");
    if (value < 30) return t("Good", "良好");
    if (value < 60) return t("Fair", "一般");
    return t("Poor", "较差");
  };
  
  const averageClass = getCloudClass(nighttimeCloudData.average);
  const eveningClass = getCloudClass(nighttimeCloudData.evening);
  const morningClass = getCloudClass(nighttimeCloudData.morning);
  
  // Quality text for tooltip or display
  const averageQuality = getCloudQualityText(nighttimeCloudData.average);
  
  return (
    <div className="bg-cosmic-800/20 rounded-md p-3 border border-cosmic-700/30 mt-2">
      <h4 className="text-sm font-medium mb-2 flex items-center">
        <CloudMoon className="h-4 w-4 mr-1.5 text-blue-400" />
        {t("Nighttime Cloud Forecast", "夜间云层预报")}
      </h4>
      
      <div className="grid grid-cols-2 gap-3">
        <div className="flex items-center">
          <CloudSun className="h-4 w-4 mr-1.5 text-amber-400" />
          <span className="text-xs">
            {t("Evening", "傍晚")}:{" "}
            <span className={eveningClass}>
              {nighttimeCloudData.evening !== null ? 
                `${nighttimeCloudData.evening.toFixed(1)}%` : 
                t("N/A", "暂无数据")}
            </span>
          </span>
        </div>
        
        <div className="flex items-center">
          <CloudMoon className="h-4 w-4 mr-1.5 text-blue-400" />
          <span className="text-xs">
            {t("Morning", "清晨")}:{" "}
            <span className={morningClass}>
              {nighttimeCloudData.morning !== null ? 
                `${nighttimeCloudData.morning.toFixed(1)}%` : 
                t("N/A", "暂无数据")}
            </span>
          </span>
        </div>
        
        <div className="col-span-2 mt-2 pt-2 border-t border-cosmic-700/30 flex items-center justify-between">
          <div className="flex items-center">
            <Sun className="h-4 w-4 mr-1.5 text-yellow-400" />
            <span className="text-xs font-medium">
              {t("Average", "平均")}:{" "}
              <span className={`${averageClass} font-semibold`}>
                {nighttimeCloudData.average.toFixed(1)}%
              </span>
            </span>
          </div>
          
          {/* Quality indicator */}
          <span className={`text-xs px-2 py-0.5 rounded-full ${averageClass} bg-opacity-20 border border-current`}>
            {averageQuality}
          </span>
        </div>
      </div>
    </div>
  );
};

export default NighttimeCloudInfo;
