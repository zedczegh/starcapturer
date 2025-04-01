
import React from "react";
import { Lightbulb } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { getProgressColor, getProgressColorClass } from "@/components/siqs/utils/progressColor";
import { formatSIQSScore } from "@/utils/geoUtils";
import { useLanguage } from "@/contexts/LanguageContext";

interface LightPollutionIndicatorProps {
  bortleScale: number;
  showLabel?: boolean;
}

const LightPollutionIndicator: React.FC<LightPollutionIndicatorProps> = ({
  bortleScale,
  showLabel = true
}) => {
  const { t } = useLanguage();
  
  // Validate Bortle scale
  const validBortleScale = Math.max(1, Math.min(9, bortleScale || 5));
  
  // Calculate progress - invert Bortle scale for display (1 is best, 9 is worst)
  const progressValue = ((10 - validBortleScale) / 9) * 100;
  
  // Get color based on value
  const progressColor = getProgressColor(progressValue / 10);
  const colorClass = getProgressColorClass(progressValue / 10);
  
  // Translate Bortle scale to text description
  const getBortleDescription = (scale: number): string => {
    switch(scale) {
      case 1: return t("Excellent Dark Sky", "极佳的暗夜天空");
      case 2: return t("Truly Dark Sky", "真正的暗夜天空");
      case 3: return t("Rural Sky", "乡村天空");
      case 4: return t("Rural/Suburban Transition", "乡村/郊区过渡");
      case 5: return t("Suburban Sky", "郊区天空");
      case 6: return t("Bright Suburban Sky", "明亮的郊区天空");
      case 7: return t("Suburban/Urban Transition", "郊区/城市过渡");
      case 8: return t("City Sky", "城市天空");
      case 9: return t("Inner-City Sky", "市中心天空");
      default: return t("Unknown", "未知");
    }
  };

  return (
    <div className="space-y-2">
      {showLabel && (
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <Lightbulb className="h-4 w-4 mr-1.5 text-yellow-400" />
            <span className="text-sm font-medium text-muted-foreground">
              {t("Light Pollution", "光污染")}
            </span>
          </div>
          <span className="text-sm font-medium">
            {t("Bortle", "波特尔")} {validBortleScale}/9
          </span>
        </div>
      )}
      
      <Progress
        value={progressValue}
        className="h-2.5 bg-primary/10"
        colorClass={colorClass}
      />
      
      <div className="text-xs text-muted-foreground">
        {getBortleDescription(validBortleScale)}
      </div>
    </div>
  );
};

export default LightPollutionIndicator;
