
import React from "react";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Info } from "lucide-react";

interface SeeingSelectorProps {
  seeingConditions: number;
  setSeeingConditions: (value: number) => void;
}

const SeeingSelector: React.FC<SeeingSelectorProps> = ({ 
  seeingConditions, 
  setSeeingConditions 
}) => {
  const { language, t } = useLanguage();
  
  const getSeeingDescription = (value: number): string => {
    const descriptions = [
      t("1: Perfect seeing, stars perfectly still", "1: 完美视宁度，恒星完全静止"),
      t("1.5: Excellent seeing, stars mostly still", "1.5: 极佳视宁度，恒星几乎静止"),
      t("2: Good seeing, slight twinkling", "2: 良好视宁度，轻微闪烁"),
      t("2.5: Average seeing, moderate twinkling", "2.5: 一般视宁度，中等闪烁"),
      t("3: Fair seeing, noticeable twinkling", "3: 尚可视宁度，明显闪烁"),
      t("3.5: Below average seeing, significant twinkling", "3.5: 低于平均视宁度，明显闪烁"),
      t("4: Poor seeing, constant twinkling", "4: 较差视宁度，持续闪烁"),
      t("4.5: Very poor seeing, images blurry", "4.5: 非常差的视宁度，图像模糊"),
      t("5: Terrible seeing, imaging nearly impossible", "5: 极差视宁度，几乎无法成像")
    ];
    
    const index = Math.round((value - 1) * 2);
    return descriptions[index] || t("Unknown", "未知");
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label htmlFor="seeingConditions" className="text-sm flex items-center gap-1">
          {t("Seeing Conditions", "视宁度")}
          <Tooltip>
            <TooltipTrigger asChild>
              <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
            </TooltipTrigger>
            <TooltipContent side="right" className="max-w-80">
              {t("Seeing refers to the steadiness of the atmosphere. Better seeing (lower values) means sharper images with more detail.", 
                "视宁度指大气的稳定性。更好的视宁度（较低的值）意味着更清晰、更详细的图像。")}
            </TooltipContent>
          </Tooltip>
        </Label>
        <span className="text-sm font-medium">{seeingConditions.toFixed(1)}</span>
      </div>
      <Slider
        id="seeingConditions"
        min={1}
        max={5}
        step={0.5}
        value={[seeingConditions]}
        onValueChange={(values) => setSeeingConditions(values[0])}
        className="py-2"
      />
      <p className="text-xs text-muted-foreground">
        {getSeeingDescription(seeingConditions)}
      </p>
    </div>
  );
};

export default SeeingSelector;
