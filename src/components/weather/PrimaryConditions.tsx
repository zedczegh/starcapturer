
import React, { memo } from "react";
import ConditionItem from "./ConditionItem";
import { useLanguage } from "@/contexts/LanguageContext";
import { 
  DynamicHumidityIcon, 
  DynamicTemperatureIcon,
  DynamicWindIcon,
  DynamicSeeingIcon
} from "./DynamicIcons";

interface PrimaryConditionsProps {
  temperature: number;
  humidity: number;
  windSpeed: number;
  seeingConditions: string;
}

const PrimaryConditions = memo<PrimaryConditionsProps>(({
  temperature,
  humidity,
  windSpeed,
  seeingConditions
}) => {
  const { t } = useLanguage();
  
  return (
    <div className="space-y-6">
      <ConditionItem
        icon={<DynamicTemperatureIcon temperature={temperature} />}
        label={t("Temperature", "温度")}
        value={`${temperature.toFixed(1)}°C`}
      />
      
      <ConditionItem
        icon={<DynamicHumidityIcon humidity={humidity} />}
        label={t("Humidity", "湿度")}
        value={`${humidity}%`}
      />
      
      <ConditionItem
        icon={<DynamicWindIcon windSpeed={windSpeed} />}
        label={t("Wind Speed", "风速")}
        value={`${windSpeed} ${t("km/h", "公里/小时")}`}
      />
      
      <ConditionItem
        icon={<DynamicSeeingIcon seeingConditions={seeingConditions} />}
        label={t("Seeing Conditions", "视宁度")}
        value={seeingConditions}
      />
    </div>
  );
});

PrimaryConditions.displayName = 'PrimaryConditions';

export default PrimaryConditions;
