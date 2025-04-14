
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Info, Star, Circle } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip';

interface MapLegendProps {
  showStarLegend?: boolean;
  showCircleLegend?: boolean;
  className?: string;
  activeView?: 'certified' | 'calculated';
}

const MapLegend: React.FC<MapLegendProps> = ({ 
  showStarLegend = true, 
  showCircleLegend = true,
  className = "",
  activeView = 'calculated'
}) => {
  const { t } = useLanguage();
  const [isCollapsed, setIsCollapsed] = useState(true);
  
  // Determine which legends to display based on props and activeView
  const displayStarLegend = showStarLegend || activeView === 'certified';
  const displayCircleLegend = showCircleLegend || activeView === 'calculated';

  return (
    <div className="absolute bottom-16 right-4 z-[999]">
      <div className="relative">
        {/* The collapsible panel */}
        <AnimatePresence>
          {!isCollapsed && (
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 50 }}
              transition={{ duration: 0.3 }}
              className={`p-3.5 rounded-lg backdrop-blur-md bg-background/90 border border-primary/30 
                         shadow-lg overflow-y-auto max-h-[80vh] w-[260px] ${className}`}
            >
              {/* Legend Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center">
                  <Star className="h-4 w-4 mr-1.5 text-primary" />
                  <span className="text-sm font-medium bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-400">
                    {t("Map Indicators Guide", "地图标记指南")}
                  </span>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-7 w-7 p-0"
                  onClick={() => setIsCollapsed(true)}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              </div>
              
              {/* Legend Content */}
              <div className="space-y-3">
                {/* Star Legend */}
                {displayStarLegend && (
                  <div className="space-y-2 bg-muted/20 p-2.5 rounded-md border border-primary/10">
                    <h4 className="text-xs font-medium text-primary/90 flex items-center">
                      <Star className="h-3 w-3 mr-1.5 fill-primary/20" />
                      {t("Certified Dark Sky Locations", "认证暗夜地点")}
                    </h4>
                    <LegendItem 
                      color="#9b87f5" 
                      label={t("Dark Sky Reserve/Sanctuary", "暗夜保护区/庇护所")} 
                      type="star"
                    />
                    <LegendItem 
                      color="#4ADE80" 
                      label={t("Dark Sky Park", "暗夜公园")} 
                      type="star"
                    />
                    <LegendItem 
                      color="#FFA500" 
                      label={t("Dark Sky Community", "暗夜社区")} 
                      type="star"
                    />
                    <LegendItem 
                      color="#0EA5E9" 
                      label={t("Urban Night Sky", "城市夜空地点")} 
                      type="star"
                    />
                  </div>
                )}

                {/* Circle Legend */}
                {displayCircleLegend && (
                  <div className="space-y-2 bg-muted/20 p-2.5 rounded-md border border-primary/10">
                    <h4 className="text-xs font-medium text-primary/90 flex items-center">
                      <Info className="h-3 w-3 mr-1.5 text-primary/80" />
                      {t("Calculated Locations (SIQS Score)", "计算地点（SIQS评分）")}
                    </h4>
                    <LegendItem 
                      color="#22c55e" 
                      label={t("Excellent (7.5-10)", "极佳 (7.5-10)")} 
                      type="circle"
                    />
                    <LegendItem 
                      color="#eab308" 
                      label={t("Good (5.5-7.4)", "良好 (5.5-7.4)")} 
                      type="circle"
                    />
                    <LegendItem 
                      color="#f97316" 
                      label={t("Average (4.0-5.4)", "一般 (4.0-5.4)")} 
                      type="circle"
                    />
                    <LegendItem 
                      color="#ef4444" 
                      label={t("Below Average (<4.0)", "较差 (<4.0)")} 
                      type="circle"
                    />
                  </div>
                )}
                
                {/* Legend Footer */}
                <div className="mt-2 text-xs text-muted-foreground bg-background/70 p-2 rounded-md border border-primary/10 shadow-sm">
                  <p>
                    {t(
                      "Tap any marker for details or click anywhere to select that location.",
                      "点击任意标记查看详情，或点击地图任意位置选择该位置。"
                    )}
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* The trigger button */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <motion.button
                initial={{ scale: 1 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsCollapsed(!isCollapsed)}
                className={`flex items-center justify-center p-2 bg-gradient-to-r from-primary/80 to-primary/90
                          rounded-full shadow-md border border-primary/40 transition-all ${isCollapsed ? '' : 'hidden'}`}
              >
                <div className="w-8 h-8 flex items-center justify-center">
                  {activeView === 'certified' ? (
                    <Star className="h-5 w-5 text-primary-foreground" />
                  ) : (
                    <Circle className="h-5 w-5 text-primary-foreground" />
                  )}
                </div>
                
                {/* Add pulsing effect to button when collapsed */}
                <motion.div 
                  className="absolute inset-0 rounded-full"
                  animate={{ 
                    boxShadow: ["0 0 0 0 rgba(139, 92, 246, 0)", "0 0 0 8px rgba(139, 92, 246, 0)", "0 0 0 0 rgba(139, 92, 246, 0)"]
                  }}
                  transition={{ duration: 2.5, repeat: Infinity }}
                />
              </motion.button>
            </TooltipTrigger>
            <TooltipContent side="left">
              {t("Map Legend", "地图图例")}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
};

interface LegendItemProps {
  color: string;
  label: string;
  type: 'star' | 'circle';
}

const LegendItem: React.FC<LegendItemProps> = ({ color, label, type }) => {
  return (
    <motion.div 
      className="flex items-center py-1"
      whileHover={{ x: 3 }}
      transition={{ type: 'spring', stiffness: 300 }}
    >
      <motion.div 
        className="bg-muted/30 p-1 rounded-full mr-2 border"
        style={{ borderColor: `${color}33` }}
        animate={{ 
          boxShadow: [
            `0 0 0 rgba(${hexToRgb(color)}, 0)`, 
            `0 0 8px rgba(${hexToRgb(color)}, 0.5)`, 
            `0 0 0 rgba(${hexToRgb(color)}, 0)`
          ] 
        }}
        transition={{ duration: 3, repeat: Infinity }}
      >
        {type === 'star' ? (
          <Star className="h-3.5 w-3.5" style={{ color, fill: color }} />
        ) : (
          <Circle className="h-3.5 w-3.5" style={{ color, fill: `${color}30` }} />
        )}
      </motion.div>
      <span className="text-xs">
        {label}
      </span>
    </motion.div>
  );
};

// Helper function to convert hex color to RGB for animations
function hexToRgb(hex: string): string {
  // Remove # if present
  hex = hex.replace('#', '');
  
  // Parse the hex values
  const r = parseInt(hex.substring(0, 2), 16) || 0;
  const g = parseInt(hex.substring(2, 4), 16) || 0;
  const b = parseInt(hex.substring(4, 6), 16) || 0;
  
  return `${r}, ${g}, ${b}`;
}

export default MapLegend;
