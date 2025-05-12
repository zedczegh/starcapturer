
import React from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import DynamicCloudCoverIcon from "@/components/weather/icons/DynamicCloudCoverIcon";

interface CloudCoverItemProps {
  cloudCover: number;
}

export const getCloudCoverColorClass = (value: number) => {
  if (value <= 10) return "text-green-400";
  if (value <= 20) return "text-green-300";
  if (value <= 30) return "text-yellow-300";
  if (value <= 50) return "text-yellow-500";
  if (value <= 70) return "text-orange-400";
  return "text-red-400";
};

const CloudCoverItem: React.FC<CloudCoverItemProps> = ({ cloudCover }) => {
  const { t } = useLanguage();
  
  return (
    <div className="flex items-center justify-between p-3 rounded-lg bg-cosmic-800/40 border border-cosmic-700/50 hover:bg-cosmic-800/60 transition-colors">
      <div className="flex items-center">
        <div className="p-2 rounded-full bg-cosmic-700/40 mr-3">
          <DynamicCloudCoverIcon cloudCover={cloudCover} className="h-5 w-5 text-cosmic-200" />
        </div>
        <span className="font-medium">{t("Current Cloud Cover", "当前云层覆盖")}</span>
      </div>
      <span className={`font-bold text-lg ${getCloudCoverColorClass(cloudCover)}`}>
        {cloudCover}%
      </span>
    </div>
  );
};

export default CloudCoverItem;
