
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
}

const SecondaryConditions = memo<SecondaryConditionsProps>(({
  cloudCover,
  moonPhase,
  bortleScale,
  aqi
}) => {
  const { t, language } = useLanguage();
  
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
  
  return (
    <div className="space-y-7">
      <ConditionItem
        icon={<DynamicCloudCoverIcon cloudCover={cloudCover} />}
        label={t("Cloud Cover", "云层覆盖")}
        value={<span className="text-lg font-medium">{cloudCover}%</span>}
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
        tooltip={bortleScale === null ? (language === 'en' ? 
          "Bortle scale could not be determined for this location" : 
          "无法确定此位置的光污染等级") : undefined}
      />
    </div>
  );
});

SecondaryConditions.displayName = 'SecondaryConditions';

export default SecondaryConditions;
