
import React from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Thermometer, Droplets, Wind, SunDim, Sun } from "lucide-react";
import LabeledValue from "./LabeledValue";

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
    <div className="space-y-4">
      <LabeledValue
        icon={<Thermometer className="h-4 w-4 text-red-400" />}
        label={t("Temperature", "温度")}
        value={`${Math.round(temperature)}°C`}
      />
      
      <LabeledValue
        icon={<Droplets className="h-4 w-4 text-blue-400" />}
        label={t("Humidity", "湿度")}
        value={`${Math.round(humidity)}%`}
      />
      
      <LabeledValue
        icon={<Wind className="h-4 w-4 text-sky-400" />}
        label={t("Wind Speed", "风速")}
        value={`${Math.round(windSpeed)} km/h`}
      />
      
      <LabeledValue
        icon={<SunDim className="h-4 w-4 text-amber-400" />}
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
