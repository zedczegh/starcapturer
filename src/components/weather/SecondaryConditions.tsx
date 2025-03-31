
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
  
  // AQI display with conditional rendering
  const aqiValue = aqi !== undefined ? (
    <>
      <span className={getAQIColor(aqi)}>
        {aqi} 
      </span> 
      <span className="text-sm ml-1">({getAQIDescription(aqi, t)})</span>
    </>
  ) : '--';
  
  // Bortle scale value - now properly handles unknown values
  const bortleValue = formatBortleScale(bortleScale, t);
  
  return (
    <div className="space-y-6">
      <ConditionItem
        icon={<DynamicCloudCoverIcon cloudCover={cloudCover} />}
        label={t("Cloud Cover", "云层覆盖")}
        value={`${cloudCover}%`}
      />
      
      <ConditionItem
        icon={<DynamicMoonIcon phase={moonPhase} />}
        label={t("Moon Phase", "月相")}
        value={moonPhase}
      />
      
      {aqi !== undefined && (
        <ConditionItem
          icon={<Gauge className="h-4 w-4 text-primary" />}
          label={t("Air Quality", "空气质量")}
          value={aqiValue}
        />
      )}
      
      <ConditionItem
        icon={<DynamicLightbulbIcon bortleScale={bortleScale} />}
        label={t("Bortle Scale", "光污染等级")}
        value={bortleValue}
        tooltip={bortleScale === null ? (language === 'en' ? 
          "Bortle scale could not be determined for this location" : 
          "无法确定此位置的光污染等级") : undefined}
      />
    </div>
  );
});

SecondaryConditions.displayName = 'SecondaryConditions';

export default SecondaryConditions;
