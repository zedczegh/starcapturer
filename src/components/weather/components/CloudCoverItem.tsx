
import React from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import DynamicCloudCoverIcon from "@/components/weather/icons/DynamicCloudCoverIcon";
import { Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

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
    <div className="space-y-1">
      <div className="flex items-center gap-2 mb-1">
        <DynamicCloudCoverIcon cloudCover={cloudCover} className="w-4 h-4 text-blue-400" />
        <div className="flex items-center">
          <span className="text-xs font-medium">{t("Current Cloud Cover", "当前云层覆盖")}</span>
          <Tooltip>
            <TooltipTrigger asChild>
              <Info className="h-3.5 w-3.5 ml-1 text-cosmic-400 cursor-help" />
            </TooltipTrigger>
            <TooltipContent className="bg-cosmic-800 border-cosmic-700">
              <p className="text-xs">
                {t("Current cloud coverage percentage", "当前云层覆盖百分比")}
              </p>
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-x-4 gap-y-1">
        <span className="text-xs text-muted-foreground">{t('Coverage', '覆盖率')}</span>
        <span className={`text-right text-sm font-medium ${getCloudCoverColorClass(cloudCover)}`}>
          {cloudCover}%
        </span>
      </div>
    </div>
  );
};

export default CloudCoverItem;
