
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
import { getMoonInfo } from "@/services/realTimeSiqs/moonPhaseCalculator";

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
  
  // Use our advanced moon phase algorithm to get consistent moon phase information
  const { name: calculatedMoonPhase } = getMoonInfo();
  
  // Determine which cloud cover to display - prefer nighttime average if available
  const displayCloudCover = nighttimeCloudData?.average !== null && nighttimeCloudData?.average !== undefined 
    ? nighttimeCloudData.average 
    : cloudCover;
    
  // Create nighttime cloud cover tooltip if data is available
  const cloudCoverTooltip = nighttimeCloudData 
    ? (language === 'en'
      ? `Current: ${cloudCover}% | Night avg: ${nighttimeCloudData.average?.toFixed(1)}%`
      : `当前: ${cloudCover}% | 夜间平均: ${nighttimeCloudData.average?.toFixed(1)}%`)
    : undefined;
  
  // AQI display with conditional rendering and enhanced sizing
  const aqiValue = aqi !== undefined ? (
    <>
      <span className={`${getAQIColor(aqi)} text-base font-medium`}>
        {aqi} 
      </span> 
      <span className="text-sm ml-1.5">({getAQIDescription(aqi, language)})</span>
    </>
  ) : '--';
  
  // Bortle scale value - now properly handles unknown values with improved confidence indicator
  const bortleValue = formatBortleScale(bortleScale, language);
  
  // Add confidence indicator for Bortle scale value (high confidence when directly measured)
  const hasHighConfidence = bortleScale !== null && 
    Number.isInteger(bortleScale) && 
    bortleScale >= 1 && 
    bortleScale <= 9;
  
  // Create label for cloud cover that indicates it's nighttime data
  const cloudCoverLabel = nighttimeCloudData?.average !== null && nighttimeCloudData?.average !== undefined
    ? (language === 'en' ? "Night Cloud Cover" : "夜间云层覆盖")
    : (language === 'en' ? "Cloud Cover" : "云层覆盖");
  
  const bortleTooltip = bortleScale === null 
    ? (language === 'en' ? "Bortle scale could not be determined for this location" : "无法确定此位置的光污染等级") 
    : undefined;
  
  // Translate moon phase from English to Chinese if needed
  const displayMoonPhase = language === 'zh' 
    ? (calculatedMoonPhase === 'New Moon' ? '新月' : 
       calculatedMoonPhase === 'Full Moon' ? '满月' : 
       calculatedMoonPhase === 'First Quarter' ? '上弦月' : 
       calculatedMoonPhase === 'Last Quarter' ? '下弦月' : 
       calculatedMoonPhase === 'Waxing Crescent' ? '蛾眉月' : 
       calculatedMoonPhase === 'Waning Crescent' ? '残月' : 
       calculatedMoonPhase === 'Waxing Gibbous' ? '盈凸月' : '亏凸月')
    : calculatedMoonPhase;
  
  return (
    <div className="space-y-7">
      <ConditionItem
        icon={<DynamicCloudCoverIcon cloudCover={displayCloudCover} />}
        label={cloudCoverLabel}
        value={<span className="text-lg font-medium">{Math.round(displayCloudCover)}%</span>}
        tooltip={cloudCoverTooltip}
        badgeText={nighttimeCloudData?.average !== null && nighttimeCloudData?.average !== undefined ? (language === 'en' ? "Night" : "夜间") : undefined}
      />
      
      <ConditionItem
        icon={<DynamicMoonIcon phase={calculatedMoonPhase} />}
        label={language === 'en' ? "Moon Phase" : "月相"}
        value={<span className="text-lg font-medium">{displayMoonPhase}</span>}
      />
      
      {aqi !== undefined && (
        <ConditionItem
          icon={<Gauge className="h-5 w-5 text-primary" />}
          label={language === 'en' ? "Air Quality" : "空气质量"}
          value={aqiValue}
        />
      )}
      
      <ConditionItem
        icon={<DynamicLightbulbIcon bortleScale={bortleScale} animated={hasHighConfidence} />}
        label={language === 'en' ? "Bortle Scale" : "光污染等级"}
        value={<span className="text-lg font-medium">{bortleValue}</span>}
        tooltip={bortleTooltip}
      />
    </div>
  );
});

SecondaryConditions.displayName = 'SecondaryConditions';

export default SecondaryConditions;
