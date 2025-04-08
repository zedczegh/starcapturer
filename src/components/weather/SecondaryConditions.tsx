
import React, { memo } from "react";
import { Gauge } from "lucide-react";
import ConditionItem from "./ConditionItem";
import { useLanguage } from "@/contexts/LanguageContext";
import { formatBortleScale, getAQIColor, getAQIDescription } from "@/utils/weatherUtils";
import { 
  DynamicMoonIcon, 
  DynamicLightbulbIcon,
  DynamicCloudCoverIcon
} from "./DynamicIcons";

interface SecondaryConditionsProps {
  cloudCover: number;
  moonPhase: string;
  bortleScale: number | null;
  aqi?: number;
  nighttimeCloudData?: {
    average: number | null;
    evening: number;
    morning: number;
  } | null;
}

const SecondaryConditions = memo<SecondaryConditionsProps>(({
  cloudCover,
  moonPhase,
  bortleScale,
  aqi,
  nighttimeCloudData
}) => {
  const { t, language } = useLanguage();
  
  // Determine which cloud cover to display - prefer nighttime average if available
  const displayCloudCover = nighttimeCloudData?.average !== null && nighttimeCloudData?.average !== undefined 
    ? nighttimeCloudData.average 
    : cloudCover;
    
  // Create nighttime cloud cover tooltip if data is available
  // Fix: Use string instead of function for tooltip
  const cloudCoverTooltip = nighttimeCloudData 
    ? (language === 'en'
      ? `Current: ${cloudCover}% | Night avg: ${nighttimeCloudData.average?.toFixed(1)}% (Evening: ${nighttimeCloudData.evening.toFixed(1)}%, Morning: ${nighttimeCloudData.morning.toFixed(1)}%)`
      : `当前: ${cloudCover}% | 夜间平均: ${nighttimeCloudData.average?.toFixed(1)}% (晚上: ${nighttimeCloudData.evening.toFixed(1)}%, 早晨: ${nighttimeCloudData.morning.toFixed(1)}%)`)
    : undefined;
  
  // AQI display with conditional rendering and enhanced sizing
  const aqiValue = aqi !== undefined ? (
    <>
      <span className={`${getAQIColor(aqi)} text-base font-medium`}>
        {aqi} 
      </span> 
      <span className="text-sm ml-1.5">({getAQIDescription(aqi, t)})</span>
    </>
  ) : '--';
  
  // Bortle scale value - now properly handles unknown values with improved confidence indicator
  const bortleValue = formatBortleScale(bortleScale, t);
  
  // Add confidence indicator for Bortle scale value (high confidence when directly measured)
  const hasHighConfidence = bortleScale !== null && 
    Number.isInteger(bortleScale) && 
    bortleScale >= 1 && 
    bortleScale <= 9;
  
  // Create label for cloud cover that indicates it's nighttime data
  const cloudCoverLabel = nighttimeCloudData?.average !== null && nighttimeCloudData?.average !== undefined
    ? t("Night Cloud Cover", "夜间云层覆盖")
    : t("Cloud Cover", "云层覆盖");
  
  // Fix: Use string for tooltip instead of function
  const bortleTooltip = bortleScale === null 
    ? (language === 'en' ? "Bortle scale could not be determined for this location" : "无法确定此位置的光污染等级") 
    : undefined;
  
  return (
    <div className="space-y-7">
      <ConditionItem
        icon={<DynamicCloudCoverIcon cloudCover={displayCloudCover} />}
        label={cloudCoverLabel}
        value={<span className="text-lg font-medium">{Math.round(displayCloudCover)}%</span>}
        tooltip={cloudCoverTooltip}
        badgeText={nighttimeCloudData?.average !== null && nighttimeCloudData?.average !== undefined ? t("Night", "夜间") : undefined}
      />
      
      <ConditionItem
        icon={<DynamicMoonIcon phase={moonPhase} />}
        label={t("Moon Phase", "月相")}
        value={<span className="text-lg font-medium">{moonPhase}</span>}
      />
      
      {aqi !== undefined && (
        <ConditionItem
          icon={<Gauge className="h-5 w-5 text-primary" />}
          label={t("Air Quality", "空气质量")}
          value={aqiValue}
        />
      )}
      
      <ConditionItem
        icon={<DynamicLightbulbIcon bortleScale={bortleScale} animated={hasHighConfidence} />}
        label={t("Bortle Scale", "光污染等级")}
        value={<span className="text-lg font-medium">{bortleValue}</span>}
        tooltip={bortleTooltip}
      />
    </div>
  );
});

SecondaryConditions.displayName = 'SecondaryConditions';

export default SecondaryConditions;
