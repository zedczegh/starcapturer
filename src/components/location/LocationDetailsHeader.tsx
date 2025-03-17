
import React from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Sparkles } from "lucide-react";

interface LocationDetailsHeaderProps {
  name: string;
}

const LocationDetailsHeader: React.FC<LocationDetailsHeaderProps> = ({ name }) => {
  const { t } = useLanguage();
  
  return (
    <div className="mb-6">
      <h1 className="text-2xl md:text-3xl font-bold flex items-center">
        <Sparkles className="h-6 w-6 mr-2 text-primary" /> 
        {name || t("Location Details", "位置详情")}
      </h1>
      <p className="text-muted-foreground mt-2">
        {t(
          "View detailed analysis and forecasts for astrophotography at this location.",
          "查看此地点的天文摄影详细分析和预报。"
        )}
      </p>
    </div>
  );
};

export default LocationDetailsHeader;
