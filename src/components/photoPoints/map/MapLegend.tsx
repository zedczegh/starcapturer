
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, ChevronLeft, Info, Star, Circle, Hotel, Eye, Globe2 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';

interface MapLegendProps {
  showStarLegend?: boolean;
  showCircleLegend?: boolean;
  className?: string;
  activeView?: 'certified' | 'calculated' | 'obscura' | 'mountains';
  onToggle?: (isOpen: boolean) => void;
}

const MapLegend: React.FC<MapLegendProps> = ({ 
  showStarLegend = true, 
  showCircleLegend = true,
  className = "",
  activeView = 'calculated',
  onToggle
}) => {
  const { t } = useLanguage();
  const [isCollapsed, setIsCollapsed] = useState(true);
  
  // Determine which legends to display based on props and activeView
  const displayStarLegend = showStarLegend || activeView === 'certified';
  const displayCircleLegend = showCircleLegend || activeView === 'calculated';
  const displayObscuraLegend = activeView === 'obscura';
  
  // Function to prevent event propagation
  const stopPropagation = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    e.preventDefault();
  };

  // Notify parent component when collapse state changes
  useEffect(() => {
    if (onToggle) {
      onToggle(!isCollapsed);
    }
  }, [isCollapsed, onToggle]);

  return (
    <div className={`z-[999] ${className}`} onClick={stopPropagation} onTouchStart={stopPropagation}>
      <div className="relative">
        {/* The collapsible panel - reduced to 75% size */}
        <AnimatePresence>
          {!isCollapsed && (
            <motion.div
              initial={{ opacity: 0, y: -50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -50 }}
              transition={{ duration: 0.3 }}
              className={`p-3 rounded-lg backdrop-blur-md bg-background/80 border border-primary/30 
                         shadow-lg overflow-y-auto max-h-[60vh] w-[195px]`}
              onClick={stopPropagation}
            >
              {/* Legend Header */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center">
                  <Star className="h-3.5 w-3.5 mr-1 text-primary" />
                  <span className="text-xs font-medium bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary-foreground">
                    {t("Map Indicators Guide", "地图标记指南")}
                  </span>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-6 w-6 p-0"
                  onClick={() => setIsCollapsed(true)}
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                </Button>
              </div>
              
              {/* Legend Content */}
              <div className="space-y-2">
                {/* Star Legend */}
                {displayStarLegend && (
                  <div className="space-y-1.5 bg-muted/20 p-2 rounded-md border border-primary/10">
                    <h4 className="text-[10px] font-medium text-primary/90 flex items-center">
                      <Star className="h-2.5 w-2.5 mr-1 fill-primary/20" />
                      {t("Certified Dark Sky Locations", "认证暗夜地点")}
                    </h4>
                    <LegendItem 
                      color="hsl(var(--primary))" 
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
                    <LegendItem 
                      color="#1e3a8a" 
                      label={t("Dark Sky Lodging", "暗夜住宿")} 
                      type="hotel"
                    />
                    <LegendItem 
                      color="#8b5cf6" 
                      label={t("UNESCO Dark Sky Place", "联合国教科文组织暗夜地点")} 
                      type="unesco"
                    />
                  </div>
                )}

                {/* Circle Legend - Updated SIQS Color Scheme */}
                {displayCircleLegend && (
                  <div className="space-y-1.5 bg-muted/20 p-2 rounded-md border border-primary/10">
                    <h4 className="text-[10px] font-medium text-primary/90 flex items-center">
                      <Info className="h-2.5 w-2.5 mr-1 text-primary/80" />
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

                {/* Obscura Legend */}
                {displayObscuraLegend && (
                  <div className="space-y-1.5 bg-muted/20 p-2 rounded-md border border-primary/10">
                    <h4 className="text-[10px] font-medium text-primary/90 flex items-center">
                      <Eye className="h-2.5 w-2.5 mr-1" />
                      {t("Atlas Obscura Locations", "奇观位置")}
                    </h4>
                    <LegendItem 
                      color="#06b6d4" 
                      label={t("Atlas Obscura Location", "奇观位置")} 
                      type="eye"
                    />
                  </div>
                )}
                
                {/* Legend Footer */}
                <div className="mt-1.5 text-[10px] text-muted-foreground bg-background/70 p-1.5 rounded-md border border-primary/10 shadow-sm">
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
        
        {/* Enhanced trigger button with improved hover animation */}
        <motion.button
          initial={{ scale: 0.95, opacity: 0.8 }}
          animate={{ 
            scale: [0.95, 1.05, 0.95],
            opacity: [0.8, 1, 0.8],
          }}
          whileHover={{ 
            scale: 1.15, 
            transition: { 
              duration: 0.3,
              type: "spring", 
              stiffness: 300 
            } 
          }}
          transition={{ 
            repeat: Infinity, 
            duration: 3,
            ease: "easeInOut"
          }}
          onClick={(e) => {
            stopPropagation(e);
            setIsCollapsed(!isCollapsed);
          }}
          className={`flex items-center justify-center p-0.5 bg-gradient-to-br from-primary/70 via-primary/60 to-primary/70
                    rounded-full shadow-lg border border-primary/30 backdrop-blur-sm transition-all ${isCollapsed ? '' : 'hidden'}`}
          style={{ boxShadow: '0 0 15px hsl(var(--primary) / 0.5)' }}
        >
          <div className="w-9 h-9 flex items-center justify-center rounded-full bg-gradient-to-br from-primary/80 to-primary/80">
            <AlertCircle className="h-5 w-5 text-primary-foreground/90" strokeWidth={2.2} />
          </div>
          
          {/* Add pulsing effect to button when collapsed */}
          <motion.div 
            className="absolute inset-0 rounded-full"
            animate={{ 
              boxShadow: [
                '0 0 0 hsl(var(--primary) / 0)',
                '0 0 10px hsl(var(--primary) / 0.7)',
                '0 0 20px hsl(var(--primary) / 0.4)',
                '0 0 0 hsl(var(--primary) / 0)'
              ]
            }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          />
        </motion.button>
      </div>
    </div>
  );
};

interface LegendItemProps {
  color: string;
  label: string;
  type: 'star' | 'circle' | 'hotel' | 'eye' | 'unesco';
}

const LegendItem: React.FC<LegendItemProps> = ({ color, label, type }) => {
  return (
    <motion.div 
      className="flex items-center py-0.5"
      whileHover={{ x: 3 }}
      transition={{ type: 'spring', stiffness: 300 }}
    >
      <motion.div 
        className="bg-muted/30 p-0.5 rounded-full mr-1.5 border"
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
          <Star className="h-3 w-3" style={{ color, fill: color }} />
        ) : type === 'hotel' ? (
          <Hotel className="h-3 w-3" style={{ color, fill: color }} />
        ) : type === 'eye' ? (
          <Eye className="h-3 w-3" style={{ color, fill: 'none', stroke: color, strokeWidth: 2 }} />
        ) : type === 'unesco' ? (
          <Globe2 className="h-3 w-3" style={{ color, fill: color }} />
        ) : (
          <Circle className="h-3 w-3" style={{ color, fill: `${color}30` }} />
        )}
      </motion.div>
      <span className="text-[10px]">
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
