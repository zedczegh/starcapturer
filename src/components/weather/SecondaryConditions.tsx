
import React from "react";
import { DynamicMoonIcon, DynamicCloudCoverIcon } from "@/components/weather/DynamicIcons";
import ConditionItem from "@/components/weather/ConditionItem";
import { useLanguage } from "@/contexts/LanguageContext";
import { Cloud, Moon, Gauge } from "lucide-react";

interface SecondaryConditionsProps {
  cloudCover: number;
  moonPhase: string;
  bortleScale: number | null;
  aqi?: number;
}

const SecondaryConditions: React.FC<SecondaryConditionsProps> = ({
  cloudCover,
  moonPhase,
  bortleScale,
  aqi
}) => {
  const { t } = useLanguage();
  
  return (
    <div className="space-y-4">
      <ConditionItem
        icon={<DynamicCloudCoverIcon cloudCover={cloudCover} className="h-8 w-8" />}
        title={t("Cloud Cover", "云量")}
        value={`${cloudCover}%`}
        description={t("Percentage of sky covered by clouds", "天空被云层覆盖的百分比")}
        warning={cloudCover > 60}
      />
      
      <ConditionItem
        icon={<DynamicMoonIcon phase={moonPhase} className="h-8 w-8" />}
        title={t("Moon Phase", "月相")}
        value={moonPhase}
        description={t("Current lunar phase", "当前月相")}
        warning={moonPhase.toLowerCase().includes("full")}
      />
      
      <ConditionItem
        icon={<Gauge className="h-8 w-8 text-purple-400" />}
        title={t("Bortle Scale", "波尔特尺度")}
        value={bortleScale !== null ? bortleScale.toString() : "–"}
        description={t("Light pollution scale (1-9)", "光污染程度 (1-9)")}
        warning={bortleScale !== null && bortleScale > 5}
      />
      
      {aqi !== undefined && (
        <ConditionItem
          icon={<Gauge className="h-8 w-8 text-green-400" />}
          title={t("Air Quality", "空气质量")}
          value={`AQI: ${aqi}`}
          description={t("Air quality index", "空气质量指数")}
          warning={aqi > 100}
        />
      )}
    </div>
  );
};

export default SecondaryConditions;
