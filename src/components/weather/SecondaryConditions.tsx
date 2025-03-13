
import React from "react";
import { Cloud, Lightbulb, Gauge } from "lucide-react";
import ConditionItem from "./ConditionItem";
import MoonPhaseIcon from "./MoonPhaseIcon";
import { useLanguage } from "@/contexts/LanguageContext";
import { formatBortleScale, getAQIColor, getAQIDescription } from "@/utils/weatherUtils";

interface SecondaryConditionsProps {
  cloudCover: number;
  moonPhase: string;
  bortleScale: number;
  aqi?: number;
}

const SecondaryConditions: React.FC<SecondaryConditionsProps> = ({
  cloudCover,
  moonPhase,
  bortleScale,
  aqi
}) => {
  const { language, t } = useLanguage();
  
  // AQI display with conditional rendering
  const aqiValue = aqi !== undefined ? (
    <>
      <span className={getAQIColor(aqi)}>
        {aqi} 
      </span> 
      <span className="text-sm ml-1">({getAQIDescription(aqi, t)})</span>
    </>
  ) : '--';
  
  return (
    <div className="space-y-6">
      <ConditionItem
        icon={<Cloud className="h-4 w-4 text-primary" />}
        label={t("Cloud Cover", "云层覆盖")}
        value={`${cloudCover}%`}
      />
      
      <ConditionItem
        icon={<MoonPhaseIcon />}
        label={t("Moon Phase", "月相")}
        value={t(moonPhase, "")}
      />
      
      {aqi !== undefined && (
        <ConditionItem
          icon={<Gauge className="h-4 w-4 text-primary" />}
          label={t("Air Quality", "空气质量")}
          value={aqiValue}
        />
      )}
      
      <ConditionItem
        icon={<Lightbulb className="h-4 w-4 text-primary" />}
        label={t("Bortle Scale", "光污染等级")}
        value={formatBortleScale(bortleScale, t)}
      />
    </div>
  );
};

export default SecondaryConditions;
