
import React from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Star, Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface BortleScaleItemProps {
  bortleScale: number | null;
}

const BortleScaleItem: React.FC<BortleScaleItemProps> = ({ bortleScale }) => {
  const { t } = useLanguage();
  
  const getBortleDescription = (value: number | null): string => {
    if (value === null) return t("Unknown", "未知");
    
    switch (value) {
      case 1: return t("Excellent dark sky", "极暗天空");
      case 2: return t("Truly dark sky", "真正的暗天空");
      case 3: return t("Rural sky", "乡村天空");
      case 4: return t("Rural/suburban transition", "乡村/郊区过渡");
      case 5: return t("Suburban sky", "郊区天空");
      case 6: return t("Bright suburban sky", "明亮的郊区天空");
      case 7: return t("Suburban/urban transition", "郊区/城市过渡");
      case 8: return t("City sky", "城市天空");
      case 9: return t("Inner city sky", "市中心天空");
      default: return t("Unknown", "未知");
    }
  };
  
  const getBortleColorClass = (value: number | null): string => {
    if (value === null) return "text-cosmic-400";
    if (value <= 2) return "text-green-400";
    if (value <= 4) return "text-blue-400";
    if (value <= 6) return "text-yellow-400";
    if (value <= 7) return "text-orange-400";
    return "text-red-400";
  };
  
  if (bortleScale === null) {
    return (
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Star className="w-4 h-4 text-yellow-400" />
          <div className="flex items-center">
            <span className="text-sm font-medium">{t("Bortle Scale", "波特尔指数")}</span>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-3.5 w-3.5 ml-1 text-cosmic-400 cursor-help" />
              </TooltipTrigger>
              <TooltipContent className="bg-cosmic-800 border-cosmic-700">
                <p className="text-xs">
                  {t("Measure of night sky darkness", "夜空黑暗度的测量")}
                </p>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>
        
        <div className="bg-cosmic-800/50 rounded-md p-2 mt-1">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">{t('Class', '等级')}</span>
            <span className="text-right text-base font-medium text-cosmic-400">{t("N/A", "暂无")}</span>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <Star className="w-4 h-4 text-yellow-400" />
        <div className="flex items-center">
          <span className="text-sm font-medium">{t("Bortle Scale", "波特尔指数")}</span>
          <Tooltip>
            <TooltipTrigger asChild>
              <Info className="h-3.5 w-3.5 ml-1 text-cosmic-400 cursor-help" />
            </TooltipTrigger>
            <TooltipContent className="bg-cosmic-800 border-cosmic-700">
              <p className="text-xs">
                {t("Measure of night sky darkness (1-9)", "夜空黑暗度的测量（1-9）")}
              </p>
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
      
      <div className="bg-cosmic-800/50 rounded-md p-2 mt-1">
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">{t('Class', '等级')}</span>
          <span className={`text-right text-base font-medium ${getBortleColorClass(bortleScale)}`}>
            {bortleScale}
          </span>
        </div>
        
        <div className="flex justify-between items-center mt-1">
          <span className="text-sm text-muted-foreground">{t('Description', '描述')}</span>
          <span className="text-right text-xs text-cosmic-300">
            {getBortleDescription(bortleScale)}
          </span>
        </div>
      </div>
    </div>
  );
};

export default BortleScaleItem;
