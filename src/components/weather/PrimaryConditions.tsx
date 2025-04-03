
import React from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { 
  DynamicTemperatureIcon, 
  DynamicHumidityIcon, 
  DynamicWindIcon, 
  DynamicSeeingIcon, 
  DynamicCloudCoverIcon 
} from "./DynamicIcons";
import LabeledValue from "./LabeledValue";
import { Sun } from "lucide-react";

interface PrimaryConditionsProps {
  temperature: number;
  humidity: number;
  windSpeed: number;
  seeingConditions: string;
  clearSkyRate?: number;
}

const PrimaryConditions: React.FC<PrimaryConditionsProps> = ({
  temperature,
  humidity,
  windSpeed,
  seeingConditions,
  clearSkyRate
}) => {
  const { t } = useLanguage();
  
  return (
    <div className="space-y-3">
      {/* Cloud Cover moved to first position as most important factor */}
      <LabeledValue
        icon={<DynamicCloudCoverIcon cloudCover={0} className="h-4 w-4 text-blue-400" />}
        label={t("Cloud Cover", "云层覆盖")}
        value={`0%`}
      />

      <LabeledValue
        icon={<DynamicTemperatureIcon temperature={temperature} className="h-4 w-4" />}
        label={t("Temperature", "温度")}
        value={`${Math.round(temperature)}°C`}
      />
      
      <LabeledValue
        icon={<DynamicHumidityIcon humidity={humidity} className="h-4 w-4" />}
        label={t("Humidity", "湿度")}
        value={`${Math.round(humidity)}%`}
      />
      
      <LabeledValue
        icon={<DynamicWindIcon windSpeed={windSpeed} className="h-4 w-4" />}
        label={t("Wind Speed", "风速")}
        value={`${Math.round(windSpeed)} km/h`}
      />
      
      <LabeledValue
        icon={<DynamicSeeingIcon seeing={seeingConditions} className="h-4 w-4 text-amber-400" />}
        label={t("Seeing Conditions", "视宁度")}
        value={seeingConditions}
      />
      
      {clearSkyRate !== undefined && (
        <LabeledValue
          icon={<Sun className="h-4 w-4 text-yellow-400" />}
          label={t("Annual Clear Sky Rate", "年均晴空率")}
          value={`${Math.round(clearSkyRate)}%`}
        />
      )}
    </div>
  );
};

export default PrimaryConditions;
