
import React from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Sun, Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { getBortleDescription } from "@/utils/weather/bortleScaleUtils";

interface BortleScaleItemProps {
  bortleScale: number | null;
}

const BortleScaleItem: React.FC<BortleScaleItemProps> = ({ bortleScale }) => {
  const { t } = useLanguage();
  
  return (
    <div className="flex items-center justify-between p-3 rounded-lg bg-cosmic-800/40 border border-cosmic-700/50 hover:bg-cosmic-800/60 transition-colors">
      <div className="flex items-center">
        <div className="p-2 rounded-full bg-cosmic-700/40 mr-3">
          <Sun className="h-5 w-5 text-cosmic-200" />
        </div>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="font-medium flex items-center">
              {t("Bortle Scale", "波尔特等级")}
              <Info className="h-3.5 w-3.5 ml-1 text-cosmic-400 inline-block" />
            </span>
          </TooltipTrigger>
          <TooltipContent side="left" className="max-w-xs bg-cosmic-800 border-cosmic-600">
            <p className="text-xs text-cosmic-100">
              {getBortleDescription(bortleScale || 5, t)}
            </p>
          </TooltipContent>
        </Tooltip>
      </div>
      <span className="font-bold text-lg text-cosmic-50">
        {bortleScale || "-"}
      </span>
    </div>
  );
};

export default BortleScaleItem;
