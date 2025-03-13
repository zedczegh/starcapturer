
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

interface BortleScaleSelectorProps {
  bortleScale: number;
  setBortleScale: (value: number) => void;
}

const BortleScaleSelector: React.FC<BortleScaleSelectorProps> = ({ 
  bortleScale, 
  setBortleScale 
}) => {
  const { language, t } = useLanguage();
  
  const getBortleScaleDescription = (value: number): string => {
    const descriptions = [
      t("1: Excellent dark-sky site, no light pollution", "1: 极佳的暗空环境，无光污染"),
      t("2: Typical truly dark site, Milky Way casts shadows", "2: 真正的黑暗区域，银河可投下阴影"),
      t("3: Rural sky, some light pollution but Milky Way still visible", "3: 乡村天空，有一些光污染但仍能看到银河"),
      t("4: Rural/suburban transition, Milky Way visible but lacks detail", "4: 乡村/郊区过渡区，能看到银河但缺乏细节"),
      t("5: Suburban sky, Milky Way very dim or invisible", "5: 郊区天空，银河非常暗或不可见"),
      t("6: Bright suburban sky, no Milky Way, only brightest constellations visible", "6: 明亮的郊区天空，看不到银河，只能看到最明亮的星座"),
      t("7: Suburban/urban transition, most stars washed out", "7: 郊区/城市过渡区，大多数恒星被洗掉"),
      t("8: Urban sky, few stars visible, planets still visible", "8: 城市天空，可见少量恒星，行星仍然可见"),
      t("9: Inner-city sky, only brightest stars and planets visible", "9: 市中心天空，只有最明亮的恒星和行星可见")
    ];
    return descriptions[value - 1] || t("Unknown", "未知");
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label htmlFor="bortleScale" className="text-sm flex items-center gap-1">
          {t("Light Pollution (Bortle Scale)", "光污染（伯特尔尺度）")}
          <Tooltip>
            <TooltipTrigger asChild>
              <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
            </TooltipTrigger>
            <TooltipContent side="right" className="max-w-80">
              {t("The Bortle scale measures the night sky's brightness on a scale of 1-9. Lower values (1-3) indicate darker skies that are better for astrophotography, while higher values (7-9) indicate brighter urban skies with significant light pollution.", 
                "伯特尔尺度用1-9的等级测量夜空的亮度。数值越低(1-3)表示天空越暗，越适合天文摄影，而数值越高(7-9)表示城市中有明显光污染的明亮天空。")}
            </TooltipContent>
          </Tooltip>
        </Label>
        <span className="text-sm font-medium">{bortleScale}</span>
      </div>
      <Slider
        id="bortleScale"
        min={1}
        max={9}
        step={1}
        value={[bortleScale]}
        onValueChange={(values) => setBortleScale(values[0])}
        className="py-2"
      />
      <p className="text-xs text-muted-foreground">
        {getBortleScaleDescription(bortleScale)}
      </p>
    </div>
  );
};

export default BortleScaleSelector;
