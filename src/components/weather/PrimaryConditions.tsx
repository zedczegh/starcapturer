
import React from "react";
import { Thermometer, Droplets, Wind, Sparkles } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { formatTemperature, formatWindSpeed } from "@/utils/unitConversion";

interface PrimaryConditionsProps {
  temperature: number;
  humidity: number;
  windSpeed: number;
  seeingConditions: string;
  language?: 'en' | 'zh';
}

const PrimaryConditions: React.FC<PrimaryConditionsProps> = ({
  temperature,
  humidity,
  windSpeed,
  seeingConditions,
  language: propLanguage
}) => {
  const { language: contextLanguage, t } = useLanguage();
  
  // Use the provided language prop if available, otherwise use context
  const language = propLanguage || contextLanguage;
  
  // Format wind speed based on language/unit system using the utility function
  const formattedWindSpeed = formatWindSpeed(windSpeed, language);
  
  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="flex flex-col items-center p-2 bg-cosmic-900/20 rounded-lg">
        <Thermometer className="h-5 w-5 text-red-400 mb-1" />
        <span className="text-xs text-muted-foreground">
          {t("Temperature", "温度")}
        </span>
        <span className="text-lg font-semibold">
          {formatTemperature(temperature, language)}
        </span>
      </div>
      
      <div className="flex flex-col items-center p-2 bg-cosmic-900/20 rounded-lg">
        <Droplets className="h-5 w-5 text-blue-400 mb-1" />
        <span className="text-xs text-muted-foreground">
          {t("Humidity", "湿度")}
        </span>
        <span className="text-lg font-semibold">
          {Math.round(humidity)}%
        </span>
      </div>
      
      <div className="flex flex-col items-center p-2 bg-cosmic-900/20 rounded-lg">
        <Wind className="h-5 w-5 text-cyan-400 mb-1" />
        <span className="text-xs text-muted-foreground">
          {t("Wind", "风速")}
        </span>
        <span className="text-lg font-semibold">
          {formattedWindSpeed}
        </span>
      </div>
      
      <div className="flex flex-col items-center p-2 bg-cosmic-900/20 rounded-lg">
        <Sparkles className="h-5 w-5 text-yellow-400 mb-1" />
        <span className="text-xs text-muted-foreground">
          {t("Seeing", "视宁度")}
        </span>
        <span className="text-lg font-semibold">
          {seeingConditions}
        </span>
      </div>
    </div>
  );
};

export default PrimaryConditions;
