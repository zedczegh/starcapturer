
import React, { memo } from "react";
import ConditionItem from "./ConditionItem";
import { useLanguage } from "@/contexts/LanguageContext";
import { 
  DynamicHumidityIcon, 
  DynamicTemperatureIcon,
  DynamicWindIcon,
  DynamicSeeingIcon
} from "@/components/weather/DynamicIcons";
import { ThermometerSun, Droplets, Wind, Eye } from "lucide-react";

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
        icon={<ThermometerSun className="h-5 w-5" />}
        label={t("Temperature", "温度")}
        value={`${temperature.toFixed(1)}°C`}
      />
      
      <ConditionItem
        icon={<Droplets className="h-5 w-5" />}
        label={t("Humidity", "湿度")}
        value={`${humidity}%`}
      />
      
      <ConditionItem
        icon={<Wind className="h-5 w-5" />}
        label={t("Wind Speed", "风速")}
        value={`${windSpeed} ${t("km/h", "公里/小时")}`}
      />
      
      <ConditionItem
        icon={<Eye className="h-5 w-5" />}
        label={t("Seeing Conditions", "视宁度")}
        value={seeingConditions}
      />
    </div>
  );
});

PrimaryConditions.displayName = 'PrimaryConditions';

export default PrimaryConditions;
