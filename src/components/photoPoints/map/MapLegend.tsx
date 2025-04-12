
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
    <div className={`p-3 rounded-lg bg-background/95 border border-border shadow-sm ${className}`}>
      <div className="flex items-center mb-1.5">
        <Info className="h-4 w-4 mr-1.5 text-muted-foreground" />
        <span className="text-sm font-medium">
          {t("Map Legend", "地图图例")}
        </span>
      </div>
      
      {showStarLegend && (
        <div className="space-y-1.5 mb-3">
          <h4 className="text-xs font-medium text-muted-foreground">
            {t("Certified Dark Sky Locations", "认证暗夜地点")}
          </h4>
          <div className="grid grid-cols-1 gap-2">
            <div className="flex items-center">
              <Star className="h-4 w-4 mr-2 text-[#9b87f5] fill-[#9b87f5]" />
              <span className="text-xs">
                {t("Dark Sky Reserve/Sanctuary", "暗夜保护区/庇护所")}
              </span>
            </div>
            <div className="flex items-center">
              <Star className="h-4 w-4 mr-2 text-[#4ADE80] fill-[#4ADE80]" />
              <span className="text-xs">
                {t("Dark Sky Park", "暗夜公园")}
              </span>
            </div>
            <div className="flex items-center">
              <Star className="h-4 w-4 mr-2 text-[#FFA500] fill-[#FFA500]" />
              <span className="text-xs">
                {t("Dark Sky Community", "暗夜社区")}
              </span>
            </div>
            <div className="flex items-center">
              <Star className="h-4 w-4 mr-2 text-[#0EA5E9] fill-[#0EA5E9]" />
              <span className="text-xs">
                {t("Urban Night Sky", "城市夜空地点")}
              </span>
            </div>
          </div>
        </div>
      )}
      
      {showCircleLegend && (
        <div className="space-y-1.5">
          <h4 className="text-xs font-medium text-muted-foreground">
            {t("Calculated Locations (SIQS Score)", "计算地点（SIQS评分）")}
          </h4>
          <div className="grid grid-cols-1 gap-2">
            <div className="flex items-center">
              <Circle className="h-4 w-4 mr-2 text-green-500 fill-green-500/30" />
              <span className="text-xs">
                {t("Excellent (7.5-10)", "极佳 (7.5-10)")}
              </span>
            </div>
            <div className="flex items-center">
              <Circle className="h-4 w-4 mr-2 text-yellow-500 fill-yellow-500/30" />
              <span className="text-xs">
                {t("Good (5.5-7.4)", "良好 (5.5-7.4)")}
              </span>
            </div>
            <div className="flex items-center">
              <Circle className="h-4 w-4 mr-2 text-orange-500 fill-orange-500/30" />
              <span className="text-xs">
                {t("Average (4.0-5.4)", "一般 (4.0-5.4)")}
              </span>
            </div>
            <div className="flex items-center">
              <Circle className="h-4 w-4 mr-2 text-red-500 fill-red-500/30" />
              <span className="text-xs">
                {t("Below Average (<4.0)", "较差 (<4.0)")}
              </span>
            </div>
          </div>
        </div>
      )}
      
      <div className="mt-3 text-xs text-muted-foreground">
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
