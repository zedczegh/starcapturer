
import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Star, Circle, Info } from 'lucide-react';

interface MapLegendProps {
  showStarLegend: boolean;
  showCircleLegend: boolean;
  className?: string;
}

const MapLegend: React.FC<MapLegendProps> = ({ 
  showStarLegend = true, 
  showCircleLegend = true,
  className = ""
}) => {
  const { t } = useLanguage();
  
  return (
    <div className={`p-3.5 rounded-lg bg-background/95 border border-border shadow-md ${className}`}>
      <div className="flex items-center mb-2">
        <Info className="h-4 w-4 mr-1.5 text-primary/80" />
        <span className="text-sm font-medium text-foreground/90">
          {t("Map Indicators Guide", "地图标记指南")}
        </span>
      </div>
      
      {showStarLegend && (
        <div className="space-y-2 mb-3.5 bg-muted/20 p-2.5 rounded-md">
          <h4 className="text-xs font-medium text-primary/90">
            {t("Certified Dark Sky Locations", "认证暗夜地点")}
          </h4>
          <div className="grid grid-cols-1 gap-2.5">
            <div className="flex items-center">
              <div className="bg-muted/30 p-1 rounded-full mr-2">
                <Star className="h-3.5 w-3.5 text-[#9b87f5] fill-[#9b87f5]" />
              </div>
              <span className="text-xs">
                {t("Dark Sky Reserve/Sanctuary", "暗夜保护区/庇护所")}
              </span>
            </div>
            <div className="flex items-center">
              <div className="bg-muted/30 p-1 rounded-full mr-2">
                <Star className="h-3.5 w-3.5 text-[#4ADE80] fill-[#4ADE80]" />
              </div>
              <span className="text-xs">
                {t("Dark Sky Park", "暗夜公园")}
              </span>
            </div>
            <div className="flex items-center">
              <div className="bg-muted/30 p-1 rounded-full mr-2">
                <Star className="h-3.5 w-3.5 text-[#FFA500] fill-[#FFA500]" />
              </div>
              <span className="text-xs">
                {t("Dark Sky Community", "暗夜社区")}
              </span>
            </div>
            <div className="flex items-center">
              <div className="bg-muted/30 p-1 rounded-full mr-2">
                <Star className="h-3.5 w-3.5 text-[#0EA5E9] fill-[#0EA5E9]" />
              </div>
              <span className="text-xs">
                {t("Urban Night Sky", "城市夜空地点")}
              </span>
            </div>
          </div>
        </div>
      )}
      
      {showCircleLegend && (
        <div className="space-y-2 bg-muted/20 p-2.5 rounded-md">
          <h4 className="text-xs font-medium text-primary/90">
            {t("Calculated Locations (SIQS Score)", "计算地点（SIQS评分）")}
          </h4>
          <div className="grid grid-cols-1 gap-2.5">
            <div className="flex items-center">
              <div className="bg-muted/30 p-1 rounded-full mr-2">
                <Circle className="h-3.5 w-3.5 text-green-500 fill-green-500/30" />
              </div>
              <span className="text-xs">
                {t("Excellent (7.5-10)", "极佳 (7.5-10)")}
              </span>
            </div>
            <div className="flex items-center">
              <div className="bg-muted/30 p-1 rounded-full mr-2">
                <Circle className="h-3.5 w-3.5 text-yellow-500 fill-yellow-500/30" />
              </div>
              <span className="text-xs">
                {t("Good (5.5-7.4)", "良好 (5.5-7.4)")}
              </span>
            </div>
            <div className="flex items-center">
              <div className="bg-muted/30 p-1 rounded-full mr-2">
                <Circle className="h-3.5 w-3.5 text-orange-500 fill-orange-500/30" />
              </div>
              <span className="text-xs">
                {t("Average (4.0-5.4)", "一般 (4.0-5.4)")}
              </span>
            </div>
            <div className="flex items-center">
              <div className="bg-muted/30 p-1 rounded-full mr-2">
                <Circle className="h-3.5 w-3.5 text-red-500 fill-red-500/30" />
              </div>
              <span className="text-xs">
                {t("Below Average (<4.0)", "较差 (<4.0)")}
              </span>
            </div>
          </div>
        </div>
      )}
      
      <div className="mt-3 text-xs text-muted-foreground bg-background/70 p-2 rounded-md shadow-sm">
        <p>
          {t(
            "Tap any marker for details or click anywhere to select that location.",
            "点击任意标记查看详情，或点击地图任意位置选择该位置。"
          )}
        </p>
      </div>
    </div>
  );
};

export default MapLegend;
